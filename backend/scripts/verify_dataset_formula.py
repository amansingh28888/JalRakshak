import pandas as pd


CSV_FILE = "data/raw/cleaned_water_quality_50k.csv"


def main():
    df = pd.read_csv(CSV_FILE)

    # ============================================================
    # 1. CHEMICAL HAZARD
    # ============================================================

    predicted_chemical = (
        (df["fluoride_mg_L"] > 1.5)
        | (df["arsenic_ug_L"] > 10)
        | (df["nitrate_mg_L"] > 45)
        | (df["uranium_ug_L"] > 30)
        | (df["iron_mg_L"] > 1.0)
    )

    chemical_match = (
        predicted_chemical
        == df["has_chemical_hazard"]
    )

    print("\n========== CHEMICAL FORMULA ==========")
    print("Predicted:", int(predicted_chemical.sum()))
    print("CSV:", int(df["has_chemical_hazard"].sum()))
    print("Matches:", int(chemical_match.sum()))
    print("Mismatches:", int((~chemical_match).sum()))

    # ============================================================
    # 2. BIOLOGICAL HAZARD
    # ============================================================

    predicted_biological = (
        df["fecal_coliform_MPN_100mL"] > 0
    )

    biological_match = (
        predicted_biological
        == df["has_biological_hazard"]
    )

    print("\n========== BIOLOGICAL FORMULA ==========")
    print("Predicted:", int(predicted_biological.sum()))
    print("CSV:", int(df["has_biological_hazard"].sum()))
    print("Matches:", int(biological_match.sum()))
    print("Mismatches:", int((~biological_match).sum()))

    # ============================================================
    # 3. PHYSICAL ISSUE
    # ============================================================

    predicted_physical = (
        (df["turbidity_NTU"] > 5)
        | (df["tds_mg_L"] > 2000)
        | (df["pH"] < 6.5)
        | (df["pH"] > 8.5)
        | (df["total_hardness_mg_L"] > 600)
    )

    physical_match = (
        predicted_physical
        == df["has_physical_issue"]
    )

    print("\n========== PHYSICAL FORMULA ==========")
    print("Predicted:", int(predicted_physical.sum()))
    print("CSV:", int(df["has_physical_issue"].sum()))
    print("Matches:", int(physical_match.sum()))
    print("Mismatches:", int((~physical_match).sum()))

    # ============================================================
    # 4. CATEGORY
    # ============================================================

    predicted_category = pd.Series(
        "POTABLE_SAFE",
        index=df.index
    )

    # Important priority:
    # chemical + biological = mixed
    predicted_category[
        predicted_chemical & predicted_biological
    ] = "CRITICAL_MIXED_HAZARD"

    predicted_category[
        predicted_chemical & ~predicted_biological
    ] = "CRITICAL_CHEMICAL_TOXIN"

    predicted_category[
        ~predicted_chemical
        & predicted_biological
    ] = "UNSAFE_BIOLOGICAL_PATHOGEN"

    predicted_category[
        ~predicted_chemical
        & ~predicted_biological
        & predicted_physical
    ] = "MODERATE_PHYSICAL_PARAM"

    category_match = (
        predicted_category
        == df["alert_category"]
    )

    print("\n========== CATEGORY FORMULA ==========")
    print("Matches:", int(category_match.sum()))
    print("Mismatches:", int((~category_match).sum()))

    # ============================================================
    # 5. ACTION CODE
    # ============================================================

    predicted_action = pd.Series(
        "SAFE_TO_DRINK",
        index=df.index
    )

    predicted_action[
        predicted_chemical
    ] = "DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY"

    predicted_action[
        ~predicted_chemical
        & predicted_biological
    ] = "BOIL_OR_CHLORINATE_REQUIRED"

    predicted_action[
        ~predicted_chemical
        & ~predicted_biological
        & predicted_physical
    ] = "FILTRATION_TREATMENT_RECOMMENDED"

    action_match = (
        predicted_action
        == df["action_code"]
    )

    print("\n========== ACTION CODE FORMULA ==========")
    print("Matches:", int(action_match.sum()))
    print("Mismatches:", int((~action_match).sum()))

    # ============================================================
    # 6. DO NOT BOIL
    # ============================================================

    predicted_do_not_boil = predicted_chemical

    boil_match = (
        predicted_do_not_boil
        == df["do_not_boil"]
    )

    print("\n========== DO NOT BOIL ==========")
    print("Predicted:", int(predicted_do_not_boil.sum()))
    print("CSV:", int(df["do_not_boil"].sum()))
    print("Matches:", int(boil_match.sum()))
    print("Mismatches:", int((~boil_match).sum()))

    # ============================================================
    # FINAL
    # ============================================================

    all_match = (
        chemical_match.all()
        and biological_match.all()
        and physical_match.all()
        and category_match.all()
        and action_match.all()
        and boil_match.all()
    )

    print("\n========================================")
    print("FINAL RESULT")
    print("========================================")

    if all_match:
        print("SUCCESS: Formula reproduces all CSV labels exactly.")
    else:
        print("NOT EXACT: Some labels still require investigation.")


if __name__ == "__main__":
    main()