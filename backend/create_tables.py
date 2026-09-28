import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("SUPABASE_DATABASE_URL")

conn = psycopg2.connect(DB_URL)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS citizen_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    block TEXT,
    village TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id BIGINT REFERENCES water_samples(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES citizen_profiles(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
""")

cursor.execute("""
ALTER TABLE citizen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Citizens can read own profile' AND tablename = 'citizen_profiles') THEN
    CREATE POLICY "Citizens can read own profile" ON citizen_profiles 
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Citizens can update own profile' AND tablename = 'citizen_profiles') THEN
    CREATE POLICY "Citizens can update own profile" ON citizen_profiles 
    FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Citizens can insert own profile' AND tablename = 'citizen_profiles') THEN
    CREATE POLICY "Citizens can insert own profile" ON citizen_profiles 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
""")

conn.commit()
print("Tables created successfully.")
conn.close()
