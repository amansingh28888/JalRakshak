import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
pg_url = os.getenv("SUPABASE_DATABASE_URL")
if not pg_url:
    raise ValueError("SUPABASE_DATABASE_URL not found in backend/.env")

conn = psycopg2.connect(pg_url)
conn.autocommit = False
cursor = conn.cursor()

try:
    print("=== APPLYING PRODUCTION JALRAKSHAK AUTH MIGRATION & REPAIR ===")

    # 1. Update user_profiles columns & constraints
    cursor.execute("""
        -- Add location columns if missing
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS state_id VARCHAR(64);
        ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS district_id VARCHAR(64);
        
        -- Default role is ALWAYS 'citizen'
        ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT 'citizen';
        ALTER TABLE public.user_profiles ALTER COLUMN status SET DEFAULT 'active';

        -- Update constraints
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_role_check') THEN
                ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_role_check;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_status_check') THEN
                ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_status_check;
            END IF;
        END $$;

        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_role_check 
        CHECK (role IN ('citizen', 'field_worker', 'analyst', 'admin'));

        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_status_check 
        CHECK (status IN ('active', 'pending_approval', 'inactive'));
    """)
    print("Step 1: user_profiles schema and constraints verified.")

    # 2. Update citizen_profiles constraints & sync trigger
    cursor.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citizen_profiles_user_id_key') THEN
                ALTER TABLE public.citizen_profiles ADD CONSTRAINT citizen_profiles_user_id_key UNIQUE (user_id);
            END IF;
        END $$;

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
                    district_id = COALESCE(EXCLUDED.district_id, public.citizen_profiles.district_id);
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        DROP TRIGGER IF EXISTS trg_sync_user_to_citizen ON public.user_profiles;
        CREATE TRIGGER trg_sync_user_to_citizen
        AFTER INSERT OR UPDATE ON public.user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.sync_user_to_citizen();
    """)
    print("Step 2: citizen_profiles constraints and sync trigger verified.")

    # 3. Update handle_new_auth_user trigger on auth.users
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
            -- Determine display name
            user_full_name := COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                split_part(NEW.email, '@', 1)
            );

            -- Check if provisioned by admin via app_metadata
            is_admin_provisioned := (NEW.raw_app_meta_data->>'role' IS NOT NULL);

            IF is_admin_provisioned THEN
                target_role := NEW.raw_app_meta_data->>'role';
                target_status := COALESCE(NEW.raw_app_meta_data->>'status', 'active');
            ELSE
                -- Public registration request
                req_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'));
                
                -- Security enforcement: public users CANNOT self-assign 'admin'
                IF req_role = 'admin' THEN
                    target_role := 'citizen';
                    target_status := 'active';
                ELSIF req_role IN ('field_worker', 'analyst') THEN
                    -- Privileged role requested publicly -> requires approval
                    target_role := req_role;
                    target_status := 'pending_approval';
                ELSE
                    target_role := 'citizen';
                    target_status := 'active';
                END IF;
            END IF;

            -- Validate role safety
            IF target_role NOT IN ('citizen', 'field_worker', 'analyst', 'admin') THEN
                target_role := 'citizen';
            END IF;

            -- Insert or update user_profiles
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
                END;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_auth_user();
    """)
    print("Step 3: handle_new_auth_user trigger verified on auth.users.")

    # 4. Safe Backfill: sync existing auth.users that lack user_profiles
    cursor.execute("""
        SELECT id, email, raw_user_meta_data, raw_app_meta_data
        FROM auth.users
        WHERE id::text NOT IN (SELECT auth_user_id FROM public.user_profiles);
    """)
    missing_users = cursor.fetchall()
    print(f"Step 4: Found {len(missing_users)} users in auth.users missing user_profiles.")

    for u in missing_users:
        u_id = str(u[0])
        u_email = u[1]
        u_meta = u[2] or {}
        u_app_meta = u[3] or {}

        u_name = u_meta.get('full_name') or u_meta.get('name') or (u_email.split('@')[0] if u_email else "User")
        
        # Determine appropriate role
        if u_app_meta.get('role'):
            u_role = u_app_meta['role']
            u_status = u_app_meta.get('status', 'active')
        else:
            # Public signup - default to citizen (active)
            u_role = 'citizen'
            u_status = 'active'

        cursor.execute("""
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
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (auth_user_id) DO NOTHING;
        """, (
            u_id,
            u_name,
            u_email,
            u_meta.get('phone'),
            u_role,
            u_status,
            u_meta.get('state_ut'),
            u_meta.get('district'),
            u_meta.get('village'),
            u_meta.get('state_id'),
            u_meta.get('district_id')
        ))
        print(f"  Backfilled user: {u_email} as {u_role} ({u_status})")

    # Commit transaction
    conn.commit()
    print("\nSUCCESS: All migration and repair steps applied cleanly!")

except Exception as e:
    conn.rollback()
    print("\nERROR during migration, rolled back:", e)
    raise e
finally:
    conn.close()
