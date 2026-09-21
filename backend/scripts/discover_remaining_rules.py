import pandas as pd
import numpy as np


CSV_FILE = "data/raw/cleaned_water_quality_50k.csv"


def main():
    df = pd.read_csv(CSV_FILE)

    # Known chemical triggers from breach_details
    known_chemical = (
        (df["fluoride_mg_L"] > 1.5)
        | (df["arsenic_ug_L"] > 10)
        | (df["nitrate_mg_L"] > 45)
        | (df["uranium_ug_L"] > 30)
    )

    # ------------------------------------------------------------
    # IRON INVESTIGATION
    # ------------------------------------------------------------

    iron_only = (
        df["has_chemical_hazard"]
        & ~known_chemical
    )

    print("\n========== IRON-ONLY CHEMICAL ROWS ==========")
    print("Rows:", int(iron_only.sum()))

    if iron_only.any():

        iron_true = df.loc[iron_only, "iron_mg_L"]

        print("Minimum iron among these chemical rows:", iron_true.min())
        print("Maximum iron:", iron_true.max())
        print("Median iron:", iron_true.median())

        print("\nQuantiles:")
        print(iron_true.quantile([0, 0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99, 1]))

    # Non-chemical rows where none of the known chemical triggers fire
    non_chemical = (
        ~df["has_chemical_hazard"]
        & ~known_chemical
    )

    iron_false = df.loc[non_chemical, "iron_mg_L"]

    print("\n========== NON-CHEMICAL IRON VALUES ==========")
    print("Rows:", len(iron_false))
    print("Maximum iron:", iron_false.max())
    print("Median iron:", iron_false.median())

    # Try candidate thresholds
    print("\n========== IRON THRESHOLD CANDIDATES ==========")

    csv_flag = df["has_chemical_hazard"]

    candidates = [
        0.1,
        0.2,
        0.3,
        0.5,
        0.75,
        1.0,
        1.5,
        2.0,
        3.0,
    ]

    for threshold in candidates:

        predicted = known_chemical | (
            df["iron_mg_L"] > threshold
        )

        matches = int((predicted == csv_flag).sum())

        print(
            f"Iron > {threshold:<4} "
            f"matches = {matches:5}/50000 "
            f"({matches / len(df) * 100:.2f}%)"
        )

    # ------------------------------------------------------------
    # PHYSICAL INVESTIGATION
    # ------------------------------------------------------------

    known_physical = (
        (df["turbidity_NTU"] > 5)
        | (df["tds_mg_L"] > 2000)
        | (df["pH"] < 6.5)
        | (df["pH"] > 8.5)
    )

    unexplained_physical = (
        df["has_physical_issue"]
        & ~known_physical
    )

    print("\n========== UNEXPLAINED PHYSICAL ROWS ==========")
    print(
        "Rows:",
        int(unexplained_physical.sum())
    )

    print("\nParameter ranges for unexplained rows:")

    for column in [
        "total_hardness_mg_L",
        "chloride_mg_L",
        "iron_mg_L",
        "turbidity_NTU",
        "tds_mg_L",
        "pH",
    ]:
        values = df.loc[
            unexplained_physical,
            column
        ]

        print(
            f"{column:30}"
            f"min={values.min():.3f} "
            f"max={values.max():.3f} "
            f"median={values.median():.3f}"
        )

    # Candidate physical thresholds
    print("\n========== PHYSICAL CANDIDATE COUNTS ==========")

    candidates_physical = {
        "hardness > 200": df["total_hardness_mg_L"] > 200,
        "hardness > 600": df["total_hardness_mg_L"] > 600,
        "hardness > 1000": df["total_hardness_mg_L"] > 1000,

        "chloride > 250": df["chloride_mg_L"] > 250,
        "chloride > 500": df["chloride_mg_L"] > 500,
        "chloride > 1000": df["chloride_mg_L"] > 1000,

        "iron > 0.3": df["iron_mg_L"] > 0.3,
        "iron > 1.0": df["iron_mg_L"] > 1.0,
    }

    for name, mask in candidates_physical.items():
        print(
            f"{name:25}"
            f"{int(mask.sum()):6} rows"
        )

    # ------------------------------------------------------------
    # Save unexplained rows
    # ------------------------------------------------------------

    output = "data/processed/unexplained_rule_rows.csv"

    df[
        unexplained_physical | iron_only
    ].to_csv(output, index=False)

    print("\nSaved investigation rows:")
    print(output)


if __name__ == "__main__":
    main()