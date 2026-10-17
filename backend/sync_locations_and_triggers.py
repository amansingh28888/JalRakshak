import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
pg_url = os.getenv("SUPABASE_DATABASE_URL")
if not pg_url:
    load_dotenv('.env')
    pg_url = os.getenv("SUPABASE_DATABASE_URL")

if not pg_url:
    raise ValueError("SUPABASE_DATABASE_URL not found in .env")

print(f"Connecting to database...")
conn = psycopg2.connect(pg_url)
conn.autocommit = True
cursor = conn.cursor()

print("Step 1: Backfilling user_profiles from citizen_profiles...")
cursor.execute("""
    UPDATE public.user_profiles u
    SET 
        state_ut = COALESCE(NULLIF(c.state, ''), u.state_ut),
        district = COALESCE(NULLIF(c.district, ''), u.district),
        state_id = COALESCE(NULLIF(c.state_id, ''), u.state_id),
        district_id = COALESCE(NULLIF(c.district_id, ''), u.district_id),
        phone = COALESCE(NULLIF(c.mobile, ''), u.phone),
        full_name = COALESCE(NULLIF(c.full_name, ''), u.full_name),
        updated_at = NOW()
    FROM public.citizen_profiles c
    WHERE c.user_id::text = u.auth_user_id
      AND (
          (c.state IS NOT NULL AND c.state != '' AND (u.state_ut IS NULL OR u.state_ut = ''))
          OR (c.district IS NOT NULL AND c.district != '' AND (u.district IS NULL OR u.district = ''))
          OR (c.mobile IS NOT NULL AND c.mobile != '' AND (u.phone IS NULL OR u.phone = ''))
      );
""")
print(f"Backfilled affected rows: {cursor.rowcount}")

print("Step 2: Creating sync_citizen_to_user trigger function...")
cursor.execute("""
    CREATE OR REPLACE FUNCTION public.sync_citizen_to_user()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE public.user_profiles
        SET 
            state_ut = CASE 
                WHEN NEW.state IS NOT NULL AND NEW.state != '' THEN NEW.state 
                ELSE public.user_profiles.state_ut 
            END,
            district = CASE 
                WHEN NEW.district IS NOT NULL AND NEW.district != '' THEN NEW.district 
                ELSE public.user_profiles.district 
            END,
            state_id = CASE 
                WHEN NEW.state_id IS NOT NULL AND NEW.state_id != '' THEN NEW.state_id 
                ELSE public.user_profiles.state_id 
            END,
            district_id = CASE 
                WHEN NEW.district_id IS NOT NULL AND NEW.district_id != '' THEN NEW.district_id 
                ELSE public.user_profiles.district_id 
            END,
            phone = CASE 
                WHEN NEW.mobile IS NOT NULL AND NEW.mobile != '' THEN NEW.mobile 
                ELSE public.user_profiles.phone 
            END,
            full_name = CASE 
                WHEN NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN NEW.full_name 
                ELSE public.user_profiles.full_name 
            END,
            updated_at = NOW()
        WHERE auth_user_id = NEW.user_id::text
          AND (
              (NEW.state IS NOT NULL AND NEW.state != '' AND (public.user_profiles.state_ut IS NULL OR public.user_profiles.state_ut != NEW.state))
              OR (NEW.district IS NOT NULL AND NEW.district != '' AND (public.user_profiles.district IS NULL OR public.user_profiles.district != NEW.district))
              OR (NEW.state_id IS NOT NULL AND NEW.state_id != '' AND (public.user_profiles.state_id IS NULL OR public.user_profiles.state_id != NEW.state_id))
              OR (NEW.district_id IS NOT NULL AND NEW.district_id != '' AND (public.user_profiles.district_id IS NULL OR public.user_profiles.district_id != NEW.district_id))
              OR (NEW.mobile IS NOT NULL AND NEW.mobile != '' AND (public.user_profiles.phone IS NULL OR public.user_profiles.phone != NEW.mobile))
              OR (NEW.full_name IS NOT NULL AND NEW.full_name != '' AND (public.user_profiles.full_name IS NULL OR public.user_profiles.full_name != NEW.full_name))
          );
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS trg_sync_citizen_to_user ON public.citizen_profiles;
    CREATE TRIGGER trg_sync_citizen_to_user
    AFTER INSERT OR UPDATE ON public.citizen_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_citizen_to_user();
""")
print("Step 2 completed: sync_citizen_to_user installed.")

print("Step 3: Updating sync_user_to_citizen trigger function with recursion guard...")
cursor.execute("""
    CREATE OR REPLACE FUNCTION public.sync_user_to_citizen()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.role = 'citizen' AND EXISTS (SELECT 1 FROM auth.users WHERE id::text = NEW.auth_user_id) THEN
            INSERT INTO public.citizen_profiles (
                user_id,
                full_name,
                mobile,
                email,
                state,
                district,
                village,
                state_id,
                district_id
            )
            VALUES (
                NEW.auth_user_id::uuid,
                NEW.full_name,
                COALESCE(NEW.phone, ''),
                NEW.email,
                COALESCE(NEW.state_ut, ''),
                COALESCE(NEW.district, ''),
                NEW.village,
                NEW.state_id,
                NEW.district_id
            )
            ON CONFLICT (user_id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                mobile = CASE 
                    WHEN EXCLUDED.mobile != '' THEN EXCLUDED.mobile 
                    ELSE public.citizen_profiles.mobile 
                END,
                email = EXCLUDED.email,
                state = CASE 
                    WHEN EXCLUDED.state != '' THEN EXCLUDED.state 
                    ELSE public.citizen_profiles.state 
                END,
                district = CASE 
                    WHEN EXCLUDED.district != '' THEN EXCLUDED.district 
                    ELSE public.citizen_profiles.district 
                END,
                village = COALESCE(EXCLUDED.village, public.citizen_profiles.village),
                state_id = COALESCE(EXCLUDED.state_id, public.citizen_profiles.state_id),
                district_id = COALESCE(EXCLUDED.district_id, public.citizen_profiles.district_id)
            WHERE (
                (EXCLUDED.state != '' AND public.citizen_profiles.state != EXCLUDED.state)
                OR (EXCLUDED.district != '' AND public.citizen_profiles.district != EXCLUDED.district)
                OR (EXCLUDED.mobile != '' AND public.citizen_profiles.mobile != EXCLUDED.mobile)
                OR (EXCLUDED.full_name != '' AND public.citizen_profiles.full_name != EXCLUDED.full_name)
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
""")
print("Step 3 completed: sync_user_to_citizen updated.")

print("Step 4: Updating handle_new_auth_user trigger with location updates...")
cursor.execute("""
    CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
    RETURNS TRIGGER AS $$
    DECLARE
        target_role VARCHAR(32);
        target_status VARCHAR(32);
        user_full_name TEXT;
        req_role TEXT;
        is_admin_provisioned BOOLEAN;
    BEGIN
        user_full_name := COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        );

        is_admin_provisioned := (NEW.raw_app_meta_data->>'role' IS NOT NULL);

        IF is_admin_provisioned THEN
            target_role := NEW.raw_app_meta_data->>'role';
            target_status := COALESCE(NEW.raw_app_meta_data->>'status', 'active');
        ELSE
            req_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'));
            IF req_role = 'admin' THEN
                target_role := 'citizen';
                target_status := 'active';
            ELSIF req_role IN ('field_worker', 'analyst') THEN
                target_role := req_role;
                target_status := 'pending_approval';
            ELSE
                target_role := 'citizen';
                target_status := 'active';
            END IF;
        END IF;

        IF target_role NOT IN ('citizen', 'field_worker', 'analyst', 'admin') THEN
            target_role := 'citizen';
        END IF;

        INSERT INTO public.user_profiles (
            auth_user_id,
            full_name,
            email,
            phone,
            role,
            status,
            state_ut,
            district,
            village,
            state_id,
            district_id
        )
        VALUES (
            NEW.id::text,
            user_full_name,
            NEW.email,
            NEW.raw_user_meta_data->>'phone',
            target_role,
            target_status,
            NEW.raw_user_meta_data->>'state_ut',
            NEW.raw_user_meta_data->>'district',
            NEW.raw_user_meta_data->>'village',
            NEW.raw_user_meta_data->>'state_id',
            NEW.raw_user_meta_data->>'district_id'
        )
        ON CONFLICT (auth_user_id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = CASE 
                WHEN public.user_profiles.full_name IS NULL OR public.user_profiles.full_name = '' 
                THEN EXCLUDED.full_name 
                ELSE public.user_profiles.full_name 
            END,
            state_ut = COALESCE(NULLIF(EXCLUDED.state_ut, ''), public.user_profiles.state_ut),
            district = COALESCE(NULLIF(EXCLUDED.district, ''), public.user_profiles.district),
            state_id = COALESCE(NULLIF(EXCLUDED.state_id, ''), public.user_profiles.state_id),
            district_id = COALESCE(NULLIF(EXCLUDED.district_id, ''), public.user_profiles.district_id),
            phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.user_profiles.phone);

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
""")
print("Step 4 completed: handle_new_auth_user updated.")

cursor.close()
conn.close()
print("Migration finished successfully!")
