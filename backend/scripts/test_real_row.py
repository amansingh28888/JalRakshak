import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import pandas as pd

from app.utils.column_mapper import build_reverse_map
from app.rules.water_quality_rules import evaluate_sample


CSV_FILE = "data/raw/cleaned_water_quality_50k.csv"


def safe_float(value):
    if pd.isna(value):
        return None

    try:
        value = float(value)
        return value if value >= 0 else None
    except (TypeError, ValueError):
        return None


# 1. Read one real row
df = pd.read_csv(CSV_FILE, nrows=1)
row = df.iloc[0].to_dict()

# 2. Build CSV → backend mapping
mapping = build_reverse_map(list(df.columns))

mapped = {}

for csv_column, canonical_field in mapping.items():
    mapped[canonical_field] = row.get(csv_column)


# 3. Build the exact structure expected by the rule engine
sample_for_rules = {
    "ph": safe_float(mapped.get("ph")),
    "turbidity_ntu": safe_float(mapped.get("turbidity_ntu")),
    "tds_mg_l": safe_float(mapped.get("tds_mg_l")),
    "fluoride_mg_l": safe_float(mapped.get("fluoride_mg_l")),
    "arsenic_mg_l": safe_float(mapped.get("arsenic_mg_l")),
    "nitrate_mg_l": safe_float(mapped.get("nitrate_mg_l")),
    "e_coli_mpn": safe_float(mapped.get("e_coli_mpn")),
    "total_coliform_mpn": safe_float(mapped.get("total_coliform_mpn")),
}


# 4. Run deterministic rule engine
verdict = evaluate_sample(sample_for_rules)


# 5. Print verification information
print("\n========== REAL CSV ROW TEST ==========")

print("CSV record_id:")
print(row.get("record_id"))

print("\nLocation:")
print(row.get("state_ut"), "-", row.get("district"))

print("\nSource:")
print(row.get("source_type"))

print("\nRaw fecal coliform:")
print(row.get("fecal_coliform_MPN_100mL"))

print("\nMapped e_coli_mpn:")
print(sample_for_rules["e_coli_mpn"])

print("\nMapped total_coliform_mpn:")
print(sample_for_rules["total_coliform_mpn"])

print("\n========== RULE ENGINE RESULT ==========")

print("Category:")
print(verdict.category)

print("\nSeverity:")
print(verdict.severity)

print("\nAction code:")
print(verdict.action_code)

print("\nDo not boil:")
print(verdict.do_not_boil)

print("\nPrimary contaminant:")
print(verdict.primary_contaminant)

print("\nReasons:")
for reason in verdict.reasons:
    print("-", reason)

print("\nSummary:")
print(verdict.summary)