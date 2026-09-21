import pandas as pd

CSV_FILE = "backend/data/raw/cleaned_water_quality_50k.csv"

df = pd.read_csv(CSV_FILE)

print("\n========== DATASET SUMMARY ==========")
print("Rows:", len(df))
print("Columns:", len(df.columns))

print("\n========== COLUMN NAMES ==========")
for i, column in enumerate(df.columns, start=1):
    print(f"{i}. {column}")

print("\n========== DATA TYPES ==========")
print(df.dtypes)

print("\n========== MISSING VALUES ==========")
print(df.isna().sum())

print("\n========== DUPLICATE ROWS ==========")
print(df.duplicated().sum())

print("\n========== FIRST 5 ROWS ==========")
print(df.head().to_string())