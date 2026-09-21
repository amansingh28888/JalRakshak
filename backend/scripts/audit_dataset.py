import pandas as pd

CSV_FILE = "backend/data/raw/cleaned_water_quality_50k.csv"

df = pd.read_csv(CSV_FILE)

print("\n========== BASIC VALIDATION ==========")
print("Rows:", len(df))
print("Columns:", len(df.columns))
print("Duplicate rows:", df.duplicated().sum())

print("\n========== ALERT CATEGORY COUNTS ==========")
print(df["alert_category"].value_counts(dropna=False))

print("\n========== ACTION CODE COUNTS ==========")
print(df["action_code"].value_counts(dropna=False))

print("\n========== DO NOT BOIL ==========")
print(df["do_not_boil"].value_counts(dropna=False))

print("\n========== BOIL RECOMMENDED ==========")
print(df["boil_recommended"].value_counts(dropna=False))

print("\n========== POTABILITY ==========")
print(df["is_potable"].value_counts(dropna=False))

print("\n========== HAZARD FLAGS ==========")
print("\nChemical:")
print(df["has_chemical_hazard"].value_counts(dropna=False))

print("\nBiological:")
print(df["has_biological_hazard"].value_counts(dropna=False))

print("\nPhysical:")
print(df["has_physical_issue"].value_counts(dropna=False))

print("\n========== DO NOT BOIL VS ACTION CODE ==========")
print(
    pd.crosstab(
        df["do_not_boil"],
        df["action_code"],
        margins=True
    )
)

print("\n========== POTABLE VS ALERT CATEGORY ==========")
print(
    pd.crosstab(
        df["is_potable"],
        df["alert_category"],
        margins=True
    )
)

print("\n========== CHEMICAL HAZARD VS ALERT CATEGORY ==========")
print(
    pd.crosstab(
        df["has_chemical_hazard"],
        df["alert_category"],
        margins=True
    )
)

print("\n========== BIOLOGICAL HAZARD VS ALERT CATEGORY ==========")
print(
    pd.crosstab(
        df["has_biological_hazard"],
        df["alert_category"],
        margins=True
    )
)

print("\n========== PARAMETER RANGES ==========")

numeric_columns = [
    "pH",
    "tds_mg_L",
    "turbidity_NTU",
    "total_hardness_mg_L",
    "chloride_mg_L",
    "nitrate_mg_L",
    "fluoride_mg_L",
    "arsenic_ug_L",
    "uranium_ug_L",
    "iron_mg_L",
    "fecal_coliform_MPN_100mL",
    "arsenic_mg_L",
    "uranium_mg_L",
]

for column in numeric_columns:
    print(
        f"{column}: "
        f"min={df[column].min()}, "
        f"max={df[column].max()}, "
        f"mean={df[column].mean():.3f}"
    )

print("\n========== UNIT CONVERSION CHECK ==========")

arsenic_error = (
    (df["arsenic_mg_L"] - (df["arsenic_ug_L"] / 1000)).abs()
)

uranium_error = (
    (df["uranium_mg_L"] - (df["uranium_ug_L"] / 1000)).abs()
)

print("Maximum arsenic conversion error:", arsenic_error.max())
print("Maximum uranium conversion error:", uranium_error.max())

print("\n========== BREACH DETAILS ==========")
print("Missing breach_details:", df["breach_details"].isna().sum())
print(
    "Rows with breach_details:",
    df["breach_details"].notna().sum()
)

print("\n========== DATE RANGE ==========")

dates = pd.to_datetime(df["sample_date"], errors="coerce")

print("Invalid dates:", dates.isna().sum())
print("Earliest:", dates.min())
print("Latest:", dates.max())