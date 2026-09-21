import sqlite3

DB_FILE = "data/water_quality.db"

NEW_COLUMNS = {
    "total_hardness_mg_l": "REAL",
    "chloride_mg_l": "REAL",
    "iron_mg_l": "REAL",
    "arsenic_ug_l": "REAL",
    "uranium_ug_l": "REAL",
    "uranium_mg_l": "REAL",
}


def main():
    print("Connecting to database...")

    con = sqlite3.connect(DB_FILE)

    try:
        cursor = con.cursor()

        # Read existing columns
        cursor.execute("PRAGMA table_info(water_samples)")
        existing_columns = {
            row[1]
            for row in cursor.fetchall()
        }

        print("\nExisting columns:")
        for column in sorted(existing_columns):
            print(f"  ✓ {column}")

        added = []

        for column, data_type in NEW_COLUMNS.items():

            if column in existing_columns:
                print(
                    f"\nAlready exists: {column}"
                )
                continue

            sql = (
                f"ALTER TABLE water_samples "
                f"ADD COLUMN {column} {data_type}"
            )

            cursor.execute(sql)

            added.append(column)

            print(
                f"\nAdded: {column} ({data_type})"
            )

        con.commit()

        print("\n========== MIGRATION RESULT ==========")

        if added:
            print("Columns added:")
            for column in added:
                print(f"  ✓ {column}")
        else:
            print("No new columns were required.")

        # Verify final schema
        cursor.execute(
            "PRAGMA table_info(water_samples)"
        )

        final_columns = [
            row[1]
            for row in cursor.fetchall()
        ]

        print("\n========== VERIFICATION ==========")

        for column in NEW_COLUMNS:
            if column in final_columns:
                print(f"✓ {column}")
            else:
                print(f"✗ {column} MISSING")

        print(
            f"\nTotal database columns: "
            f"{len(final_columns)}"
        )

    finally:
        con.close()


if __name__ == "__main__":
    main()