import os
import uuid
import psycopg2
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.water_sample import WaterSample
from app.services.alert_engine import process_alerts_for_sample

load_dotenv()
DB_URL = os.getenv("SUPABASE_DATABASE_URL")

print("Starting test scenario...")

conn = psycopg2.connect(DB_URL)
cursor = conn.cursor()

# 1. Create a test citizen in citizen_profiles
# We will create a fake auth user id for this test since we bypass full signup
fake_user_id = str(uuid.uuid4())

# (In a real test, we would insert into auth.users first, but since citizen_profiles
# REFERENCES auth.users, it will fail if we insert a fake uuid that isn't in auth.users.
# Let's see if we can insert into auth.users)
try:
    cursor.execute("""
    INSERT INTO auth.users (id, instance_id, aud, role, email)
    VALUES (%s, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.citizen.123@example.com')
    ON CONFLICT (id) DO NOTHING;
    """, (fake_user_id,))
    
    cursor.execute("""
    INSERT INTO citizen_profiles (user_id, full_name, mobile, email, state, district, block, village)
    VALUES (%s, 'Test Citizen', '9876543210', 'test.citizen.123@example.com', 'Punjab', 'SAS Nagar', 'Block', 'Test Village')
    RETURNING id;
    """, (fake_user_id,))
    citizen_id = cursor.fetchone()[0]
    
    # 2. Create another citizen from another district
    fake_user_id2 = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO auth.users (id, instance_id, aud, role, email)
    VALUES (%s, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'wrong.district@example.com')
    ON CONFLICT (id) DO NOTHING;
    """, (fake_user_id2,))
    
    cursor.execute("""
    INSERT INTO citizen_profiles (user_id, full_name, mobile, email, state, district)
    VALUES (%s, 'Wrong Citizen', '1111111111', 'wrong.district@example.com', 'Punjab', 'Ludhiana')
    RETURNING id;
    """, (fake_user_id2,))
    
    conn.commit()
    print("Created Test Citizen in SAS Nagar, Punjab")
    print("Created Wrong Citizen in Ludhiana, Punjab")
except Exception as e:
    print(f"Error creating test users (maybe they exist?): {e}")
    conn.rollback()
    
# Get the citizen ID just in case it was already there
cursor.execute("SELECT id FROM citizen_profiles WHERE email = 'test.citizen.123@example.com'")
citizen_res = cursor.fetchone()
if citizen_res:
    citizen_id = citizen_res[0]

# 3. Create a test critical alert using SQLAlchemy
db: Session = SessionLocal()

new_sample = WaterSample(
    sample_id=f"TEST-{uuid.uuid4().hex[:6]}",
    state_ut="Punjab",
    district="SAS Nagar",
    village="Kharar",
    ph=7.5,
    nitrate_mg_l=68.0,
    severity="CRITICAL",
    primary_contaminant="Nitrate",
    alert_category="CRITICAL_CHEMICAL_TOXIN",
    import_batch="test_script"
)
db.add(new_sample)
db.commit()
db.refresh(new_sample)
print(f"Created critical sample {new_sample.sample_id} in SAS Nagar, Punjab (Nitrate 68 mg/L)")

# 4. Run the alert engine
print("Running alert engine...")
process_alerts_for_sample(new_sample.id)

# 5. Verify the logs
cursor.execute("""
    SELECT recipient, status FROM notification_logs WHERE alert_id = %s
""", (new_sample.id,))
logs = cursor.fetchall()
print("\nNotification Logs for this alert:")
if not logs:
    print("No logs found!")
else:
    for log in logs:
        print(f"Recipient: {log[0]}, Status: {log[1]}")

conn.close()
db.close()
