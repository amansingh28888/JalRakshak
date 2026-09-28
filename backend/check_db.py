import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DATABASE_URL")

conn = psycopg2.connect(DB_URL)
cursor = conn.cursor()

cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
""")
tables = cursor.fetchall()
print("Tables in public schema:")
for t in tables:
    print(f"- {t[0]}")
    
    # describe table
    cursor.execute(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = '{t[0]}'
    """)
    cols = cursor.fetchall()
    for c in cols:
        print(f"  {c[0]} ({c[1]})")

conn.close()
