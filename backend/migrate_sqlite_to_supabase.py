import os
import sqlite3
from dotenv import load_dotenv
from supabase import create_client, Client

# ============================================================
# CONFIG
# ============================================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing from .env")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is missing from .env")

SQLITE_DB = "data/water_quality.db"
TABLE_NAME = "water_samples"

BATCH_SIZE = 500


# ============================================================
# SUPABASE CLIENT
# ============================================================

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)


# ============================================================
# SQLITE
# ============================================================

conn = sqlite3.connect(SQLITE_DB)
conn.row_factory = sqlite3.Row

cursor = conn.cursor()

cursor.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}")
total_rows = cursor.fetchone()[0]

print("=" * 60)
print("JalRakshak SQLite → Supabase Migration")
print("=" * 60)
print(f"SQLite rows: {total_rows}")
print(f"Batch size:  {BATCH_SIZE}")
print()


# ============================================================
# READ COLUMN NAMES
# ============================================================

cursor.execute(f"PRAGMA table_info({TABLE_NAME})")
columns = [row["name"] for row in cursor.fetchall()]

print(f"Columns: {len(columns)}")
print()


# ============================================================
# MIGRATION
# ============================================================

offset = 0
inserted = 0

while offset < total_rows:

    cursor.execute(
        f"""
        SELECT *
        FROM {TABLE_NAME}
        ORDER BY id
        LIMIT ? OFFSET ?
        """,
        (BATCH_SIZE, offset)
    )

    rows = cursor.fetchall()

    if not rows:
        break

    batch = []

    for row in rows:
        record = {}

        for column in columns:
            value = row[column]

            # SQLite integer → PostgreSQL boolean
            if column == "do_not_boil" and value is not None:
                value = bool(value)

            record[column] = value

        batch.append(record)

    try:
        response = (
            supabase
            .table(TABLE_NAME)
            .upsert(
                batch,
                on_conflict="sample_id"
            )
            .execute()
        )

        inserted += len(batch)
        offset += len(batch)

        print(
            f"Progress: {inserted:,}/{total_rows:,} "
            f"({inserted / total_rows * 100:.1f}%)"
        )

    except Exception as e:
        print()
        print("=" * 60)
        print("MIGRATION FAILED")
        print("=" * 60)
        print(f"Failed around row: {offset}")
        print(f"Error: {e}")
        conn.close()
        raise


# ============================================================
# CLOSE SQLITE
# ============================================================

conn.close()


# ============================================================
# FINAL VERIFICATION
# ============================================================

print()
print("=" * 60)
print("Migration completed")
print("=" * 60)

result = (
    supabase
    .table(TABLE_NAME)
    .select("id", count="exact")
    .limit(1)
    .execute()
)

supabase_count = result.count

print(f"SQLite count:   {total_rows:,}")
print(f"Supabase count: {supabase_count:,}")

if supabase_count == total_rows:
    print()
    print("SUCCESS: All rows migrated successfully.")
else:
    print()
    print("WARNING: Row counts do not match.")

print("=" * 60)