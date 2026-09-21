import pandas as pd

from app.utils.column_mapper import build_reverse_map
from app.rules.water_quality_rules import evaluate_sample


CSV_FILE = "data/raw/cleaned_water_quality_50k.csv"
OUTPUT_FILE = "data/processed/rule_engine_comparison.csv"


def safe_float(value):
    """
    Convert a value to float safely.

    NaN, invalid values, and negative measurements become None.
    """
    if pd.isna(value):
        return None

    try:
        value = float(value)
        return value if value >= 0 else None
    except (TypeError, ValueError):
        return None


def build_rule_sample(row, mapping):
    """
    Convert one CSV row into the canonical sample structure
    expected by the deterministic JalRakshak rule engine.
    """

    mapped = {}

    for csv_column, canonical_field in mapping.items():
        mapped[canonical_field] = row.get(csv_column)

    return {
        # ──────────────────────────────────────────────────────────
        # Physical parameters
        # ──────────────────────────────────────────────────────────

        "ph": safe_float(
            mapped.get("ph")
        ),

        "turbidity_ntu": safe_float(
            mapped.get("turbidity_ntu")
        ),

        "tds_mg_l": safe_float(
            mapped.get("tds_mg_l")
        ),

        "total_hardness_mg_l": safe_float(
            mapped.get("total_hardness_mg_l")
        ),

        "chloride_mg_l": safe_float(
            mapped.get("chloride_mg_l")
        ),

        # ──────────────────────────────────────────────────────────
        # Chemical parameters
        # ──────────────────────────────────────────────────────────

        "fluoride_mg_l": safe_float(
            mapped.get("fluoride_mg_l")
        ),

        "arsenic_mg_l": safe_float(
            mapped.get("arsenic_mg_l")
        ),

        "arsenic_ug_l": safe_float(
            mapped.get("arsenic_ug_l")
        ),

        "iron_mg_l": safe_float(
            mapped.get("iron_mg_l")
        ),

        "uranium_mg_l": safe_float(
            mapped.get("uranium_mg_l")
        ),

        "uranium_ug_l": safe_float(
            mapped.get("uranium_ug_l")
        ),

        "nitrate_mg_l": safe_float(
            mapped.get("nitrate_mg_l")
        ),

        # ──────────────────────────────────────────────────────────
        # Biological parameters
        # ──────────────────────────────────────────────────────────

        # The actual CSV contains fecal coliform.
        # The current JalRakshak canonical biological pathway
        # uses e_coli_mpn for this indicator.
        "e_coli_mpn": safe_float(
            mapped.get("e_coli_mpn")
        ),

        # The CSV does not contain a separate total-coliform
        # measurement, so we intentionally do NOT duplicate
        # fecal coliform into this field.
        "total_coliform_mpn": safe_float(
            mapped.get("total_coliform_mpn")
        ),
    }


def main():
    print("Loading dataset...")

    df = pd.read_csv(CSV_FILE)

    print(f"Rows loaded: {len(df):,}")

    mapping = build_reverse_map(list(df.columns))

    print("\n========== IMPORTANT MAPPINGS ==========")

    print(
        "record_id ->",
        mapping.get("record_id")
    )

    print(
        "fecal_coliform_MPN_100mL ->",
        mapping.get("fecal_coliform_MPN_100mL")
    )

    print(
        "total_coliform_mpn ->",
        mapping.get("total_coliform_mpn")
    )

    print(
        "iron_mg_L ->",
        mapping.get("iron_mg_L")
    )

    print(
        "total_hardness_mg_L ->",
        mapping.get("total_hardness_mg_L")
    )

    print(
        "arsenic_ug_L ->",
        mapping.get("arsenic_ug_L")
    )

    print(
        "uranium_ug_L ->",
        mapping.get("uranium_ug_L")
    )

    print("\nRunning deterministic rule engine...")

    results = []

    for _, row in df.iterrows():

        row_dict = row.to_dict()

        sample = build_rule_sample(
            row_dict,
            mapping
        )

        verdict = evaluate_sample(sample)

        results.append(
            {
                # ──────────────────────────────────────────────
                # Identity
                # ──────────────────────────────────────────────

                "record_id": row.get("record_id"),

                # ──────────────────────────────────────────────
                # CSV classification
                # ──────────────────────────────────────────────

                "csv_category": row.get("alert_category"),
                "engine_category": verdict.category,

                "csv_action_code": row.get("action_code"),
                "engine_action_code": verdict.action_code,

                "csv_do_not_boil": bool(
                    row.get("do_not_boil")
                ),

                "engine_do_not_boil": verdict.do_not_boil,

                "csv_is_potable": bool(
                    row.get("is_potable")
                ),

                "engine_severity": verdict.severity,

                "primary_contaminant": (
                    verdict.primary_contaminant
                ),

                # ──────────────────────────────────────────────
                # Measurement values
                # ──────────────────────────────────────────────

                "ph": row.get("pH"),

                "turbidity_ntu": row.get(
                    "turbidity_NTU"
                ),

                "tds_mg_L": row.get(
                    "tds_mg_L"
                ),

                "total_hardness_mg_L": row.get(
                    "total_hardness_mg_L"
                ),

                "chloride_mg_L": row.get(
                    "chloride_mg_L"
                ),

                "fluoride_mg_L": row.get(
                    "fluoride_mg_L"
                ),

                "arsenic_ug_L": row.get(
                    "arsenic_ug_L"
                ),

                "arsenic_mg_L": row.get(
                    "arsenic_mg_L"
                ),

                "iron_mg_L": row.get(
                    "iron_mg_L"
                ),

                "uranium_ug_L": row.get(
                    "uranium_ug_L"
                ),

                "uranium_mg_L": row.get(
                    "uranium_mg_L"
                ),

                "nitrate_mg_L": row.get(
                    "nitrate_mg_L"
                ),

                "fecal_coliform_MPN_100mL": row.get(
                    "fecal_coliform_MPN_100mL"
                ),

                # ──────────────────────────────────────────────
                # Location
                # ──────────────────────────────────────────────

                "state_ut": row.get(
                    "state_ut"
                ),

                "district": row.get(
                    "district"
                ),
            }
        )

    comparison = pd.DataFrame(results)

    # ─────────────────────────────────────────────────────────────
    # Match calculations
    # ─────────────────────────────────────────────────────────────

    comparison["category_match"] = (
        comparison["csv_category"]
        == comparison["engine_category"]
    )

    comparison["action_match"] = (
        comparison["csv_action_code"]
        == comparison["engine_action_code"]
    )

    comparison["do_not_boil_match"] = (
        comparison["csv_do_not_boil"]
        == comparison["engine_do_not_boil"]
    )

    # ─────────────────────────────────────────────────────────────
    # Anti-boiling invariant
    # ─────────────────────────────────────────────────────────────

    comparison["anti_boil_violation"] = (
        comparison["engine_category"].isin(
            [
                "CRITICAL_CHEMICAL_TOXIN",
                "CRITICAL_MIXED_HAZARD",
            ]
        )
        & (
            ~comparison["engine_do_not_boil"]
        )
    )

    # ─────────────────────────────────────────────────────────────
    # Save detailed report
    # ─────────────────────────────────────────────────────────────

    comparison.to_csv(
        OUTPUT_FILE,
        index=False
    )

    # ─────────────────────────────────────────────────────────────
    # Summary
    # ─────────────────────────────────────────────────────────────

    total = len(comparison)

    category_matches = int(
        comparison["category_match"].sum()
    )

    action_matches = int(
        comparison["action_match"].sum()
    )

    boil_matches = int(
        comparison["do_not_boil_match"].sum()
    )

    category_mismatches = (
        total - category_matches
    )

    action_mismatches = (
        total - action_matches
    )

    boil_mismatches = (
        total - boil_matches
    )

    print(
        "\n========== COMPARISON SUMMARY =========="
    )

    print(
        f"Total samples:                {total:,}"
    )

    print(
        f"Category matches:             "
        f"{category_matches:,} "
        f"({category_matches / total * 100:.2f}%)"
    )

    print(
        f"Category mismatches:          "
        f"{category_mismatches:,} "
        f"({category_mismatches / total * 100:.2f}%)"
    )

    print(
        f"Action-code matches:          "
        f"{action_matches:,} "
        f"({action_matches / total * 100:.2f}%)"
    )

    print(
        f"Action-code mismatches:       "
        f"{action_mismatches:,} "
        f"({action_mismatches / total * 100:.2f}%)"
    )

    print(
        f"Do-not-boil matches:          "
        f"{boil_matches:,} "
        f"({boil_matches / total * 100:.2f}%)"
    )

    print(
        f"Do-not-boil mismatches:       "
        f"{boil_mismatches:,} "
        f"({boil_mismatches / total * 100:.2f}%)"
    )

    print(
        "\nAnti-boiling violations "
        "(engine chemical/mixed but do_not_boil=False):"
    )

    print(
        int(
            comparison[
                "anti_boil_violation"
            ].sum()
        )
    )

    # ─────────────────────────────────────────────────────────────
    # Category distributions
    # ─────────────────────────────────────────────────────────────

    print(
        "\n========== CSV CATEGORY COUNTS =========="
    )

    print(
        comparison[
            "csv_category"
        ].value_counts()
    )

    print(
        "\n========== ENGINE CATEGORY COUNTS =========="
    )

    print(
        comparison[
            "engine_category"
        ].value_counts()
    )

    # ─────────────────────────────────────────────────────────────
    # Confusion matrix
    # ─────────────────────────────────────────────────────────────

    print(
        "\n========== CATEGORY CONFUSION TABLE =========="
    )

    confusion = pd.crosstab(
        comparison["csv_category"],
        comparison["engine_category"],
        margins=True,
    )

    print(confusion)

    # ─────────────────────────────────────────────────────────────
    # Top category mismatches
    # ─────────────────────────────────────────────────────────────

    print(
        "\n========== TOP MISMATCHES =========="
    )

    mismatches = comparison[
        ~comparison["category_match"]
    ]

    if len(mismatches) > 0:

        mismatch_columns = [
            "record_id",
            "csv_category",
            "engine_category",
            "csv_action_code",
            "engine_action_code",
            "turbidity_ntu",
            "tds_mg_L",
            "total_hardness_mg_L",
            "fluoride_mg_L",
            "arsenic_ug_L",
            "arsenic_mg_L",
            "iron_mg_L",
            "uranium_ug_L",
            "uranium_mg_L",
            "nitrate_mg_L",
            "fecal_coliform_MPN_100mL",
            "state_ut",
            "district",
        ]

        print(
            mismatches[
                mismatch_columns
            ]
            .head(20)
            .to_string(index=False)
        )

    else:
        print(
            "No category mismatches found."
        )

    print(
        f"\nDetailed report saved to:\n"
        f"{OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()