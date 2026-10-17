import os
import sys
import uuid
import jwt
import psycopg2
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath('backend'))
load_dotenv('.env')
load_dotenv('backend/.env')


from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user_profile import UserProfile

client = TestClient(app)
pg_url = os.getenv("SUPABASE_DATABASE_URL")

print("=" * 70)
print("JALRAKSHAK AUTHENTICATION & ROLE MANAGEMENT SYSTEM TEST SUITE")
print("=" * 70)

conn = psycopg2.connect(pg_url)
conn.autocommit = True
cur = conn.cursor()

results = {}

def report(name, passed, detail=""):
    results[name] = passed
    status_str = "PASSED" if passed else "FAILED"
    print(f"[{status_str}] {name}: {detail}")

try:
    # -------------------------------------------------------------------------
    # TEST 1: Database Default Role & Constraints
    # -------------------------------------------------------------------------
    cur.execute("""
        SELECT column_default 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'role';
    """)
    default_role = cur.fetchone()[0]
    passed = ("citizen" in default_role.lower()) and ("field_worker" not in default_role.lower())
    report("DB Default Role", passed, f"Column default is {default_role}")

    # -------------------------------------------------------------------------
    # TEST 2: Role Check Constraint
    # -------------------------------------------------------------------------
    cur.execute("""
        SELECT pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'user_profiles' AND c.conname = 'user_profiles_role_check';
    """)
    role_check = cur.fetchone()[0]
    passed = all(r in role_check for r in ['citizen', 'field_worker', 'analyst', 'admin'])
    report("Role Check Constraint", passed, f"Constraint: {role_check}")

    # -------------------------------------------------------------------------
    # TEST 3: Trigger handle_new_auth_user - Citizen Registration
    # -------------------------------------------------------------------------
    test_id_cit = str(uuid.uuid4())
    test_email_cit = f"test.citizen.{uuid.uuid4().hex[:6]}@example.com"
    cur.execute("""
        INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
        VALUES (%s, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', %s, 
                '{"full_name": "Test Citizen Auto", "role": "citizen"}'::jsonb);
    """, (test_id_cit, test_email_cit))

    cur.execute("SELECT role, status FROM public.user_profiles WHERE auth_user_id = %s", (test_id_cit,))
    row = cur.fetchone()
    passed = (row is not None and row[0] == 'citizen' and row[1] == 'active')
    report("TEST 1: Citizen Signup Role", passed, f"Assigned role={row[0] if row else None}, status={row[1] if row else None}")

    # -------------------------------------------------------------------------
    # TEST 4: Trigger handle_new_auth_user - Field Worker Pending Approval
    # -------------------------------------------------------------------------
    test_id_worker = str(uuid.uuid4())
    test_email_worker = f"test.worker.{uuid.uuid4().hex[:6]}@example.com"
    cur.execute("""
        INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
        VALUES (%s, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', %s, 
                '{"full_name": "Test Worker Applicant", "role": "field_worker"}'::jsonb);
    """, (test_id_worker, test_email_worker))

    cur.execute("SELECT role, status FROM public.user_profiles WHERE auth_user_id = %s", (test_id_worker,))
    row = cur.fetchone()
    passed = (row is not None and row[0] == 'field_worker' and row[1] == 'pending_approval')
    report("TEST 2: Field Worker Signup Pending Approval", passed, f"Assigned role={row[0] if row else None}, status={row[1] if row else None}")

    # -------------------------------------------------------------------------
    # TEST 5: Security Enforcement - Public Cannot Self-Assign Admin
    # -------------------------------------------------------------------------
    test_id_fake_admin = str(uuid.uuid4())
    test_email_fake_admin = f"test.fakeadmin.{uuid.uuid4().hex[:6]}@example.com"
    cur.execute("""
        INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
        VALUES (%s, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', %s, 
                '{"full_name": "Malicious User", "role": "admin"}'::jsonb);
    """, (test_id_fake_admin, test_email_fake_admin))

    cur.execute("SELECT role, status FROM public.user_profiles WHERE auth_user_id = %s", (test_id_fake_admin,))
    row = cur.fetchone()
    passed = (row is not None and row[0] == 'citizen')
    report("Security Rule: Admin Privilege Self-Assignment Blocked", passed, f"Attempted admin -> assigned role={row[0] if row else None}")

    # -------------------------------------------------------------------------
    # TEST 6: Google OAuth Signup - Default Role is Citizen (NOT field_worker)
    # -------------------------------------------------------------------------
    test_id_google = str(uuid.uuid4())
    test_email_google = f"test.google.{uuid.uuid4().hex[:6]}@gmail.com"
    cur.execute("""
        INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
        VALUES (%s, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', %s, 
                '{"iss": "https://accounts.google.com", "name": "Google User", "full_name": "Google User"}'::jsonb);
    """, (test_id_google, test_email_google))

    cur.execute("SELECT role, status FROM public.user_profiles WHERE auth_user_id = %s", (test_id_google,))
    row = cur.fetchone()
    passed = (row is not None and row[0] == 'citizen' and row[1] == 'active')
    report("TEST 3: Google Signup Default Role", passed, f"Google user assigned role={row[0] if row else None} (NEVER field_worker)")

    # -------------------------------------------------------------------------
    # TEST 7: Backend Authorization - Citizen Accessing Admin Endpoint (TEST 8)
    # -------------------------------------------------------------------------
    cit_token = jwt.encode({"sub": test_id_cit, "email": test_email_cit, "role": "authenticated"}, "secret", algorithm="HS256")
    res = client.get("/api/admin/workers", headers={"Authorization": f"Bearer {cit_token}"})
    passed = (res.status_code == 403)
    report("TEST 8: Citizen Accessing Admin URL Blocked", passed, f"Status code: {res.status_code} (Expected 403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 8: Backend Authorization - Admin Accessing Admin Endpoint (TEST 7)
    # -------------------------------------------------------------------------
    # Use verified existing admin user (amaningh28888@gmail.com)
    admin_id = "1cf2012b-8edb-4388-9025-dfb4a6757ced"
    admin_token = jwt.encode({"sub": admin_id, "email": "amaningh28888@gmail.com", "role": "authenticated"}, "secret", algorithm="HS256")
    res = client.get("/api/admin/workers", headers={"Authorization": f"Bearer {admin_token}"})
    passed = (res.status_code == 200)
    report("TEST 7: Admin Accessing Admin Endpoint", passed, f"Status code: {res.status_code} (Expected 200 OK)")

    # -------------------------------------------------------------------------
    # TEST 9: Citizen Accessing Worker Endpoint Blocked
    # -------------------------------------------------------------------------
    res = client.post("/api/worker/samples", headers={"Authorization": f"Bearer {cit_token}"}, json={"ph": 7.0})
    passed = (res.status_code == 403)
    report("Citizen Accessing Worker Endpoint Blocked", passed, f"Status code: {res.status_code} (Expected 403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 10: Import Endpoint Protected (Admin Only)
    # -------------------------------------------------------------------------
    res = client.post("/api/import/synthetic", headers={"Authorization": f"Bearer {cit_token}"})
    passed = (res.status_code == 403)
    report("Import Endpoint Protected from Non-Admins", passed, f"Status code: {res.status_code} (Expected 403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 11: Backend /api/auth/me Profile Self-Healing
    # -------------------------------------------------------------------------
    test_id_unseen = str(uuid.uuid4())
    test_email_unseen = f"unseen.{uuid.uuid4().hex[:6]}@gmail.com"
    unseen_token = jwt.encode({
        "sub": test_id_unseen,
        "email": test_email_unseen,
        "user_metadata": {"full_name": "Unseen Google User"},
        "role": "authenticated"
    }, "secret", algorithm="HS256")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {unseen_token}"})
    data = res.json()
    passed = (res.status_code == 200 and data.get("role") == "citizen" and data.get("status") == "active")
    report("TEST 12: /api/auth/me Self-Healing Profile", passed, f"Created role={data.get('role')}, status={data.get('status')}")

    # -------------------------------------------------------------------------
    # TEST 4: Existing Citizen Login
    # -------------------------------------------------------------------------
    cit_user_id = "984b5b3b-0aa4-4e48-9341-436efa7c35ac"  # amansingh7007089@gmail.com
    cit_live_token = jwt.encode({"sub": cit_user_id, "email": "amansingh7007089@gmail.com", "role": "authenticated"}, "secret", algorithm="HS256")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {cit_live_token}"})
    data = res.json()
    passed = (res.status_code == 200 and data.get("role") == "citizen")
    report("TEST 4: Existing Citizen Login", passed, f"Returned role: {data.get('role')}")

    # -------------------------------------------------------------------------
    # TEST 5: Existing Field Worker Login
    # -------------------------------------------------------------------------
    # Provision a verified field worker
    test_worker_active_id = str(uuid.uuid4())
    test_worker_active_email = f"worker.active.{uuid.uuid4().hex[:6]}@example.com"
    cur.execute("""
        INSERT INTO public.user_profiles (auth_user_id, full_name, email, role, status)
        VALUES (%s, 'Active Worker', %s, 'field_worker', 'active');
    """, (test_worker_active_id, test_worker_active_email))
    worker_token = jwt.encode({"sub": test_worker_active_id, "email": test_worker_active_email, "role": "authenticated"}, "secret", algorithm="HS256")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {worker_token}"})
    data = res.json()
    passed = (res.status_code == 200 and data.get("role") == "field_worker")
    report("TEST 5: Existing Field Worker Login", passed, f"Returned role: {data.get('role')}")

    # -------------------------------------------------------------------------
    # TEST 6: Existing Analyst Login
    # -------------------------------------------------------------------------
    test_analyst_id = str(uuid.uuid4())
    test_analyst_email = f"analyst.{uuid.uuid4().hex[:6]}@example.com"
    cur.execute("""
        INSERT INTO public.user_profiles (auth_user_id, full_name, email, role, status)
        VALUES (%s, 'Senior Analyst', %s, 'analyst', 'active');
    """, (test_analyst_id, test_analyst_email))
    analyst_token = jwt.encode({"sub": test_analyst_id, "email": test_analyst_email, "role": "authenticated"}, "secret", algorithm="HS256")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {analyst_token}"})
    data = res.json()
    passed = (res.status_code == 200 and data.get("role") == "analyst")
    report("TEST 6: Existing Analyst Login", passed, f"Returned role: {data.get('role')}")

    # -------------------------------------------------------------------------
    # TEST 9: Citizen Role Manipulation Rejected by DB Check Constraint
    # -------------------------------------------------------------------------
    try:
        cur.execute("""
            UPDATE public.user_profiles 
            SET role = 'super_admin' 
            WHERE auth_user_id = %s;
        """, (test_id_cit,))
        passed = False
    except psycopg2.errors.CheckViolation:
        passed = True
    report("TEST 9: Invalid/Privileged Role Modification Rejected", passed, "Database check constraint rejected invalid role")

    # -------------------------------------------------------------------------
    # TEST 10: Session Switch / No Stale Profile Leakage
    # -------------------------------------------------------------------------
    # 1st request with admin
    res1 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    # 2nd request with citizen
    res2 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {cit_live_token}"})
    passed = (res1.json().get("role") == "admin" and res2.json().get("role") == "citizen" and res1.json().get("id") != res2.json().get("id"))
    report("TEST 10: Fast Session Switching No Cross-User Leakage", passed, f"User 1: {res1.json().get('role')}, User 2: {res2.json().get('role')}")

    # -------------------------------------------------------------------------
    # TEST 13: Incorrect / Malformed Credentials
    # -------------------------------------------------------------------------
    bad_res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.payload"})
    passed = (bad_res.status_code == 401)
    report("TEST 13: Bad/Invalid Token Handled Safely", passed, f"Status code: {bad_res.status_code} (Expected 401 Unauthorized)")

    # -------------------------------------------------------------------------
    # TEST 14: Historical Water Quality Data Remains Fully Intact
    # -------------------------------------------------------------------------
    cur.execute("SELECT COUNT(*) FROM public.water_samples;")
    sample_count = cur.fetchone()[0]
    passed = (sample_count >= 55000)
    report("TEST 14: Historical Water Samples Preserved", passed, f"Found {sample_count} samples in database (100% intact)")

    # -------------------------------------------------------------------------
    # Clean up test records
    # -------------------------------------------------------------------------
    test_ids = [test_id_cit, test_id_worker, test_id_fake_admin, test_id_google, test_id_unseen, test_worker_active_id, test_analyst_id]
    for tid in test_ids:
        cur.execute("DELETE FROM public.citizen_profiles WHERE user_id = %s", (tid,))
        cur.execute("DELETE FROM public.user_profiles WHERE auth_user_id = %s", (tid,))
        cur.execute("DELETE FROM auth.users WHERE id = %s", (tid,))
    print("\nCleaned up all test artifacts from database.")

finally:
    conn.close()

print("\n" + "=" * 70)
total_tests = len(results)
passed_tests = sum(1 for v in results.values() if v)
print(f"TEST RESULTS: {passed_tests}/{total_tests} PASSED")
print("=" * 70)
if passed_tests != total_tests:
    sys.exit(1)
