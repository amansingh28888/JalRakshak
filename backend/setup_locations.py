import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DATABASE_URL")
conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

print("Creating locations table...")

cur.execute("""
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    state_id VARCHAR(10) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    district_id VARCHAR(10) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    UNIQUE(state_id, district_id)
);
""")

# Insert dummy data (Punjab, Maharashtra)
locations_data = [
    ('03', 'Punjab', '0301', 'Amritsar'),
    ('03', 'Punjab', '0302', 'Bathinda'),
    ('03', 'Punjab', '0303', 'Jalandhar'),
    ('03', 'Punjab', '0304', 'Ludhiana'),
    ('03', 'Punjab', '0305', 'SAS Nagar'),
    ('03', 'Punjab', '0306', 'Patiala'),
    
    ('27', 'Maharashtra', '2701', 'Mumbai City'),
    ('27', 'Maharashtra', '2702', 'Pune'),
    ('27', 'Maharashtra', '2703', 'Nashik'),
    ('27', 'Maharashtra', '2704', 'Nagpur'),
]

cur.execute("TRUNCATE TABLE locations;")
for state_id, state_name, district_id, district_name in locations_data:
    cur.execute("""
        INSERT INTO locations (state_id, state_name, district_id, district_name)
        VALUES (%s, %s, %s, %s)
    """, (state_id, state_name, district_id, district_name))

conn.commit()

# Create RLS policies for locations so frontend can read it
cur.execute("""
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
""")

cur.execute("""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to locations'
    ) THEN
        CREATE POLICY "Allow public read access to locations" ON locations FOR SELECT USING (true);
    END IF;
END
$$;
""")

conn.commit()
print("Locations table created and populated successfully.")
conn.close()
