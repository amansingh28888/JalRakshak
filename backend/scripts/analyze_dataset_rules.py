import pandas as pd


CSV_FILE = "data/raw/cleaned_water_quality_50k.csv"


def main():
    df = pd.read_csv(CSV_FILE)

    # Candidate chemical triggers based on parameters present
    chemical_triggers = {
        "fluoride_gt_1_5": df["fluoride_mg_L"] > 1.5,
        "arsenic_gt_10_ug": df["arsenic_ug_L"] > 10,
        "nitrate_gt_45": df["nitrate_mg_L"] > 45,
        "iron_gt_0_3": df["iron_mg_L"] > 0.3,
        "uranium_gt_30_ug": df["uranium_ug_L"] > 30,
        "chloride_gt_250": df["chloride_mg_L"] > 250,
        "hardness_gt_200": df["total_hardness_mg_L"] > 200,
    }

    print("\n========== CSV CHEMICAL HAZARD ==========")
    print(
        "Dataset chemical hazard:",
        int(df["has_chemical_hazard"].sum())
    )

    print("\n========== CANDIDATE CHEMICAL TRIGGERS ==========")

    for name, mask in chemical_triggers.items():

        print(
            f"{name:25} "
            f"{int(mask.sum()):6} rows"
        )

    # Union of likely chemical hazards
    candidate_chemical = (
        chemical_triggers["fluoride_gt_1_5"]
        | chemical_triggers["arsenic_gt_10_ug"]
        | chemical_triggers["nitrate_gt_45"]
        | chemical_triggers["iron_gt_0_3"]
        | chemical_triggers["uranium_gt_30_ug"]
    )

    print("\nCandidate chemical union:")
    print(int(candidate_chemical.sum()))

    # Compare candidate union with CSV
    csv_chemical = df["has_chemical_hazard"]

    print("\n========== CHEMICAL FLAG COMPARISON ==========")

    print(
        "Both True:",
        int((candidate_chemical & csv_chemical).sum())
    )

    print(
        "CSV True / Candidate False:",
        int((csv_chemical & ~candidate_chemical).sum())
    )

    print(
        "CSV False / Candidate True:",
        int((~csv_chemical & candidate_chemical).sum())
    )

    # Rows where CSV says chemical but none of our candidate triggers fire
    unexplained = df[
        csv_chemical & ~candidate_chemical
    ].copy()

    print("\n========== UNEXPLAINED CHEMICAL HAZARDS ==========")
    print("Rows:", len(unexplained))

    if len(unexplained) > 0:
        print(
            unexplained[
                [
                    "record_id",
                    "fluoride_mg_L",
                    "arsenic_ug_L",
                    "nitrate_mg_L",
                    "iron_mg_L",
                    "uranium_ug_L",
                    "chloride_mg_L",
                    "total_hardness_mg_L",
                    "turbidity_NTU",
                    "tds_mg_L",
                    "pH",
                    "fecal_coliform_MPN_100mL",
                ]
            ]
            .head(30)
            .to_string(index=False)
        )

    # ─────────────────────────────────────────────────────────────
    # Physical classification
    # ─────────────────────────────────────────────────────────────

    physical_triggers = {
        "turbidity_gt_5": df["turbidity_NTU"] > 5,
        "tds_gt_2000": df["tds_mg_L"] > 2000,
        "ph_outside_6_5_8_5": (
            (df["pH"] < 6.5)
            | (df["pH"] > 8.5)
        ),
    }

    candidate_physical = (
        physical_triggers["turbidity_gt_5"]
        | physical_triggers["tds_gt_2000"]
        | physical_triggers["ph_outside_6_5_8_5"]
    )

    print("\n========== PHYSICAL FLAG ==========")

    print(
        "Dataset physical issue:",
        int(df["has_physical_issue"].sum())
    )

    for name, mask in physical_triggers.items():
        print(
            f"{name:25} "
            f"{int(mask.sum()):6} rows"
        )

    print("\nCandidate physical union:")
    print(int(candidate_physical.sum()))

    print("\nPhysical flag mismatches:")

    print(
        "CSV True / Candidate False:",
        int(
            (
                df["has_physical_issue"]
                & ~candidate_physical
            ).sum()
        )
    )

    print(
        "CSV False / Candidate True:",
        int(
            (
                ~df["has_physical_issue"]
                & candidate_physical
            ).sum()
        )
    )

    # ─────────────────────────────────────────────────────────────
    # Biological classification
    # ─────────────────────────────────────────────────────────────

    candidate_bio = (
        df["fecal_coliform_MPN_100mL"] > 0
    )

    print("\n========== BIOLOGICAL FLAG ==========")

    print(
        "Dataset biological issue:",
        int(df["has_biological_hazard"].sum())
    )

    print(
        "Fecal coliform > 0:",
        int(candidate_bio.sum())
    )

    print(
        "Biological mismatches:",
        int(
            (
                df["has_biological_hazard"]
                != candidate_bio
            ).sum()
        )
    )

    # ─────────────────────────────────────────────────────────────
    # Chemical examples with no current 3-parameter trigger
    # ─────────────────────────────────────────────────────────────

    print(
        "\n========== IRON / URANIUM CHECK =========="
    )

    no_current_chemical = (
        (df["fluoride_mg_L"] <= 1.5)
        & (df["arsenic_ug_L"] <= 10)
        & (df["nitrate_mg_L"] <= 45)
    )

    iron_only = (
        df["has_chemical_hazard"]
        & no_current_chemical
        & (df["iron_mg_L"] > 0.3)
    )

    uranium_only = (
        df["has_chemical_hazard"]
        & no_current_chemical
        & (df["uranium_ug_L"] > 30)
    )

    print(
        "Chemical hazard explained by iron > 0.3:",
        int(iron_only.sum())
    )

    print(
        "Chemical hazard explained by uranium > 30 ug/L:",
        int(uranium_only.sum())
    )

    print(
        "\nExamples of uranium-related candidates:"
    )

    print(
        df[
            uranium_only
        ][
            [
                "record_id",
                "uranium_ug_L",
                "iron_mg_L",
                "fluoride_mg_L",
                "arsenic_ug_L",
                "nitrate_mg_L",
                "has_chemical_hazard",
                "alert_category",
                "action_code",
            ]
        ]
        .head(20)
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()