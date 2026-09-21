import pandas as pd


CSV_FILE = "data/raw/cleaned_water_quality_50k.csv"


def main():
    df = pd.read_csv(CSV_FILE)

    print("\n========== DATASET PARAMETERS ==========")

    candidate_columns = [
        "total_hardness_mg_L",
        "chloride_mg_L",
        "uranium_ug_L",
        "uranium_mg_L",
        "iron_mg_L",
        "fluoride_mg_L",
        "arsenic_ug_L",
        "arsenic_mg_L",
        "nitrate_mg_L",
        "turbidity_NTU",
        "tds_mg_L",
        "pH",
        "fecal_coliform_MPN_100mL",
    ]

    for column in candidate_columns:
        print(f"{column:35} {column in df.columns}")

    # Rows where the dataset says chemical hazard
    chemical = df[df["has_chemical_hazard"] == True].copy()

    print("\n========== CHEMICAL HAZARD ROWS ==========")
    print("Total:", len(chemical))

    print("\n========== CHEMICAL PARAMETER RANGES ==========")

    for column in candidate_columns:
        if column in chemical.columns:
            print(
                f"{column:35} "
                f"min={chemical[column].min()} "
                f"max={chemical[column].max()} "
                f"mean={chemical[column].mean():.4f}"
            )

    # Rows where CSV says chemical hazard
    # but our current rule engine did not produce DO_NOT_BOIL.
    mismatches = df[
        (df["has_chemical_hazard"] == True)
        & (df["do_not_boil"] == True)
    ].copy()

    print("\n========== CSV CHEMICAL + DO NOT BOIL ==========")
    print("Rows:", len(mismatches))

    print("\n========== FIRST 20 FULL RECORDS ==========")

    print(
        mismatches[
            [
                "record_id",
                "state_ut",
                "district",
                "pH",
                "tds_mg_L",
                "turbidity_NTU",
                "total_hardness_mg_L",
                "chloride_mg_L",
                "nitrate_mg_L",
                "fluoride_mg_L",
                "arsenic_ug_L",
                "arsenic_mg_L",
                "uranium_ug_L",
                "uranium_mg_L",
                "iron_mg_L",
                "fecal_coliform_MPN_100mL",
                "alert_category",
                "action_code",
                "has_chemical_hazard",
                "do_not_boil",
            ]
        ]
        .head(20)
        .to_string(index=False)
    )

    # Specifically inspect the first mismatch we already saw.
    row = df[df["record_id"] == "IWQ-00080"]

    print("\n========== IWQ-00080 ==========")

    if len(row) == 1:
        print(row.to_string(index=False))
    else:
        print("IWQ-00080 not found.")


if __name__ == "__main__":
    main()