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


def main():

    df = pd.read_csv(CSV_FILE)

    mapping = build_reverse_map(list(df.columns))

    rows = []

    for _, row in df.iterrows():

        mapped = {}

        for csv_column, canonical_field in mapping.items():
            mapped[canonical_field] = row.get(csv_column)

        sample = {
            "ph": safe_float(mapped.get("ph")),
            "turbidity_ntu": safe_float(mapped.get("turbidity_ntu")),
            "tds_mg_l": safe_float(mapped.get("tds_mg_l")),
            "fluoride_mg_l": safe_float(mapped.get("fluoride_mg_l")),
            "arsenic_mg_l": safe_float(mapped.get("arsenic_mg_l")),
            "nitrate_mg_l": safe_float(mapped.get("nitrate_mg_l")),
            "e_coli_mpn": safe_float(mapped.get("e_coli_mpn")),
            "total_coliform_mpn": safe_float(
                mapped.get("total_coliform_mpn")
            ),
        }

        verdict = evaluate_sample(sample)

        if bool(row["do_not_boil"]) != verdict.do_not_boil:

            rows.append({
                "record_id": row["record_id"],

                "csv_category": row["alert_category"],
                "engine_category": verdict.category,

                "csv_action": row["action_code"],
                "engine_action": verdict.action_code,

                "csv_do_not_boil": bool(row["do_not_boil"]),
                "engine_do_not_boil": verdict.do_not_boil,

                "chemical_flag_csv": bool(row["has_chemical_hazard"]),
                "biological_flag_csv": bool(row["has_biological_hazard"]),

                "fluoride": row["fluoride_mg_L"],
                "arsenic_ug": row["arsenic_ug_L"],
                "arsenic_mg": row["arsenic_mg_L"],
                "nitrate": row["nitrate_mg_L"],

                "fecal_coliform": row[
                    "fecal_coliform_MPN_100mL"
                ],

                "turbidity": row["turbidity_NTU"],
                "tds": row["tds_mg_L"],
                "ph": row["pH"],

                "state": row["state_ut"],
                "district": row["district"],
            })

    result = pd.DataFrame(rows)

    print("\n========== DO-NOT-BOIL MISMATCH ANALYSIS ==========")

    print("Mismatch rows:", len(result))

    print("\n========== CSV CATEGORY ==========")
    print(result["csv_category"].value_counts())

    print("\n========== ENGINE CATEGORY ==========")
    print(result["engine_category"].value_counts())

    print("\n========== CSV CHEMICAL FLAG ==========")
    print(result["chemical_flag_csv"].value_counts())

    print("\n========== CSV BIOLOGICAL FLAG ==========")
    print(result["biological_flag_csv"].value_counts())

    print("\n========== CSV CATEGORY VS ENGINE CATEGORY ==========")

    print(
        pd.crosstab(
            result["csv_category"],
            result["engine_category"],
            margins=True
        )
    )

    print("\n========== CHEMICAL + BIOLOGICAL COMBINATION ==========")

    print(
        pd.crosstab(
            result["chemical_flag_csv"],
            result["biological_flag_csv"],
            margins=True
        )
    )

    print("\n========== FIRST 50 MISMATCHES ==========")

    print(
        result.head(50).to_string(index=False)
    )

    output = "data/processed/do_not_boil_mismatches.csv"

    result.to_csv(output, index=False)

    print("\nDetailed mismatch file:")
    print(output)


if __name__ == "__main__":
    main()