import pandas as pd
import re
from collections import Counter

CSV_FILE = "data/raw/cleaned_water_quality_50k.csv"


def main():
    df = pd.read_csv(CSV_FILE)

    print("\n========== KEY CHEMICAL RECORDS ==========")

    ids = [
        "IWQ-00009",
        "IWQ-00011",
        "IWQ-00017",
        "IWQ-00030",
        "IWQ-00080",
        "IWQ-00148",
        "IWQ-00170",
    ]

    selected = df[df["record_id"].isin(ids)]

    print(
        selected[
            [
                "record_id",
                "iron_mg_L",
                "uranium_ug_L",
                "fluoride_mg_L",
                "arsenic_ug_L",
                "nitrate_mg_L",
                "turbidity_NTU",
                "tds_mg_L",
                "pH",
                "fecal_coliform_MPN_100mL",
                "has_chemical_hazard",
                "has_biological_hazard",
                "has_physical_issue",
                "alert_category",
                "action_code",
                "breach_details",
            ]
        ].to_string(index=False)
    )

    print("\n========== ALL BREACH DETAIL EXAMPLES ==========")

    non_empty = df[df["breach_details"].notna()]

    for _, row in non_empty.head(30).iterrows():
        print(
            f"{row['record_id']}: "
            f"{row['breach_details']}"
        )

    print("\n========== PARAMETER FREQUENCY IN BREACH DETAILS ==========")

    parameter_counter = Counter()

    for text in non_empty["breach_details"]:
        if not isinstance(text, str):
            continue

        parts = text.split(";")

        for part in parts:
            part = part.strip()

            if ":" in part:
                parameter = part.split(":", 1)[0].strip()
                parameter_counter[parameter] += 1

    for parameter, count in parameter_counter.most_common():
        print(f"{parameter:30} {count:6}")

    print("\n========== MAXIMUM VALUES MENTIONED ==========")

    max_values = Counter()

    for text in non_empty["breach_details"]:
        if not isinstance(text, str):
            continue

        matches = re.findall(
            r"Max:\s*([0-9]+(?:\.[0-9]+)?)",
            text
        )

        for value in matches:
            max_values[value] += 1

    for value, count in max_values.most_common():
        print(f"Max: {value:15} {count:6}")


if __name__ == "__main__":
    main()