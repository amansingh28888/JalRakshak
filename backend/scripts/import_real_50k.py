"""
JalRakshak — Real 50K Dataset Importer
======================================

Flow:
    cleaned_water_quality_50k.csv
        ↓
    column_mapper
        ↓
    canonical records
        ↓
    deterministic rule engine
        ↓
    SQLite database

Safety:
    - Default mode = PREVIEW ONLY
    - Existing DB is NOT changed unless --replace is supplied
    - CSV classification columns are NOT trusted
    - Rule engine recalculates category/action/do_not_boil
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from app.database import SessionLocal
from scripts.import_service import import_samples_from_records
from app.utils.column_mapper import build_reverse_map


CSV_FILE = Path(
    "data/raw/cleaned_water_quality_50k.csv"
)


def safe_value(value):
    """
    Convert pandas NaN to None.
    Preserve other values.
    """
    if pd.isna(value):
        return None

    return value


def build_records(df: pd.DataFrame) -> list[dict]:
    """
    Convert the real CSV into canonical records expected
    by scripts.import_service.
    """

    mapping = build_reverse_map(
        list(df.columns)
    )

    records = []

    for _, row in df.iterrows():

        raw = row.to_dict()

        # -------------------------------------------------------------
        # Map CSV columns -> canonical fields
        # -------------------------------------------------------------

        mapped = {}

        for csv_column, canonical_field in mapping.items():

            mapped[canonical_field] = safe_value(
                raw.get(csv_column)
            )

        # -------------------------------------------------------------
        # Build canonical record
        # -------------------------------------------------------------

        record = {

            # =========================================================
            # Identity
            # =========================================================

            "sample_id": safe_value(
                raw.get("record_id")
            ),

            # =========================================================
            # Location
            # =========================================================

            "state_ut": safe_value(
                raw.get("state_ut")
            ),

            "district": safe_value(
                raw.get("district")
            ),

            # CSV contains city_or_town.
            # Existing WaterSample model uses village.
            "village": safe_value(
                raw.get("city_or_town")
            ),

            # =========================================================
            # Source
            # =========================================================

            "water_source_type": safe_value(
                raw.get("source_type")
            ),

            # =========================================================
            # Time
            # =========================================================

            "season_cycle": safe_value(
                raw.get("season")
            ),

            "sample_date": safe_value(
                raw.get("sample_date")
            ),

            # =========================================================
            # Physical parameters
            # =========================================================

            "ph": safe_value(
                mapped.get("ph")
            ),

            "turbidity_ntu": safe_value(
                mapped.get("turbidity_ntu")
            ),

            "tds_mg_l": safe_value(
                mapped.get("tds_mg_l")
            ),

            "total_hardness_mg_l": safe_value(
                mapped.get("total_hardness_mg_l")
            ),

            "chloride_mg_l": safe_value(
                mapped.get("chloride_mg_l")
            ),

            # =========================================================
            # Chemical parameters
            # =========================================================

            "fluoride_mg_l": safe_value(
                mapped.get("fluoride_mg_l")
            ),

            "arsenic_mg_l": safe_value(
                mapped.get("arsenic_mg_l")
            ),

            "arsenic_ug_l": safe_value(
                mapped.get("arsenic_ug_l")
            ),

            "nitrate_mg_l": safe_value(
                mapped.get("nitrate_mg_l")
            ),

            "iron_mg_l": safe_value(
                mapped.get("iron_mg_l")
            ),

            "uranium_mg_l": safe_value(
                mapped.get("uranium_mg_l")
            ),

            "uranium_ug_l": safe_value(
                mapped.get("uranium_ug_l")
            ),

            # =========================================================
            # Biological parameter
            # =========================================================

            # Actual source column:
            # fecal_coliform_MPN_100mL
            #
            # Column mapper maps this to e_coli_mpn
            # for the current biological rule pathway.
            "e_coli_mpn": safe_value(
                mapped.get("e_coli_mpn")
            ),

            # Real CSV does NOT contain a separate
            # total-coliform measurement.
            "total_coliform_mpn": None,
        }

        records.append(record)

    return records


def print_mapping_check(df: pd.DataFrame):
    """
    Print important CSV -> canonical mappings.
    """

    mapping = build_reverse_map(
        list(df.columns)
    )

    print(
        "\n========== IMPORTANT MAPPINGS =========="
    )

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


def preview(
    df: pd.DataFrame,
    records: list[dict],
):
    """
    Print a safety preview before any database modification.
    """

    print(
        "\n========== IMPORT PREVIEW =========="
    )

    print(
        f"CSV rows:                 {len(df):,}"
    )

    print(
        f"Prepared records:         {len(records):,}"
    )

    print(
        "Current database target:   data/water_quality.db"
    )

    print(
        "\nFirst record:"
    )

    first = records[0]

    preview_fields = [
        "sample_id",
        "state_ut",
        "district",
        "village",
        "water_source_type",
        "season_cycle",
        "sample_date",
        "ph",
        "turbidity_ntu",
        "tds_mg_l",
        "total_hardness_mg_l",
        "chloride_mg_l",
        "fluoride_mg_l",
        "arsenic_mg_l",
        "arsenic_ug_l",
        "nitrate_mg_l",
        "iron_mg_l",
        "uranium_mg_l",
        "uranium_ug_l",
        "e_coli_mpn",
        "total_coliform_mpn",
    ]

    for key in preview_fields:

        print(
            f"{key:25} {first.get(key)}"
        )


def main():

    parser = argparse.ArgumentParser(
        description=(
            "Import JalRakshak real 50K water-quality dataset"
        )
    )

    parser.add_argument(
        "--replace",
        action="store_true",
        help=(
            "Replace existing water_samples after "
            "validation. Without this flag the script "
            "only previews the import."
        ),
    )

    args = parser.parse_args()

    # ==============================================================
    # STEP 1 — Check CSV
    # ==============================================================

    if not CSV_FILE.exists():

        raise FileNotFoundError(
            f"CSV not found: {CSV_FILE}"
        )

    # ==============================================================
    # STEP 2 — Load dataset
    # ==============================================================

    print(
        "Loading real dataset..."
    )

    df = pd.read_csv(
        CSV_FILE
    )

    print(
        f"Rows loaded: {len(df):,}"
    )

    if len(df) != 50_000:

        raise ValueError(
            f"Expected 50,000 rows but found {len(df):,}"
        )

    # ==============================================================
    # STEP 3 — Check mappings
    # ==============================================================

    print_mapping_check(
        df
    )

    # ==============================================================
    # STEP 4 — Build canonical records
    # ==============================================================

    print(
        "\nMapping CSV columns..."
    )

    records = build_records(
        df
    )

    if len(records) != len(df):

        raise RuntimeError(
            "Record conversion count does not match CSV row count."
        )

    # ==============================================================
    # STEP 5 — Preview
    # ==============================================================

    preview(
        df,
        records
    )

    # ==============================================================
    # STEP 6 — Preview-only mode
    # ==============================================================

    if not args.replace:

        print(
            "\n========================================"
        )

        print(
            "PREVIEW ONLY"
        )

        print(
            "Database was NOT modified."
        )

        print(
            "\nTo replace the existing 5,000 demo rows "
            "with the real 50,000-row dataset, run:"
        )

        print(
            "\npython -m scripts.import_real_50k --replace"
        )

        print(
            "\n========================================"
        )

        return

    # ==============================================================
    # STEP 7 — Safety message
    # ==============================================================

    print(
        "\n========================================"
    )

    print(
        "REAL IMPORT STARTING"
    )

    print(
        "Existing water_samples will be replaced."
    )

    print(
        "Backup expected at:"
    )

    print(
        "data/water_quality_before_50k_backup.db"
    )

    print(
        "========================================\n"
    )

    # ==============================================================
    # STEP 8 — Database session
    # ==============================================================

    db = SessionLocal()

    try:

        # ==========================================================
        # STEP 9 — Import through COMPLETE importer
        # ==========================================================

        report = import_samples_from_records(
            records=records,
            db=db,
            replace_existing=True,
        )

        # ==========================================================
        # STEP 10 — Report
        # ==========================================================

        print(
            "\n========== IMPORT COMPLETE =========="
        )

        print(
            f"Batch ID:                 {report.batch_id}"
        )

        print(
            f"Rows received:            {report.rows_received:,}"
        )

        print(
            f"Rows accepted:            {report.rows_accepted:,}"
        )

        print(
            f"Rows rejected:            {report.rows_rejected:,}"
        )

        print(
            f"Rows duplicate:           {report.rows_duplicate:,}"
        )

        print(
            f"Rows transformed:         {report.rows_transformed:,}"
        )

        print(
            f"Chemical alerts:          {report.chemical_alerts:,}"
        )

        print(
            f"Biological alerts:        {report.biological_alerts:,}"
        )

        print(
            f"Mixed hazards:            {report.mixed_hazards:,}"
        )

        print(
            f"Physical concerns:        {report.physical_concerns:,}"
        )

        print(
            f"Safe rows:                {report.safe_rows:,}"
        )

        print(
            f"Do-not-boil rows:         {report.do_not_boil_rows:,}"
        )

        print(
            f"Missing-critical rows:    "
            f"{report.rows_missing_critical:,}"
        )

        # ==========================================================
        # STEP 11 — Basic count assertion
        # ==========================================================

        if report.rows_accepted != 50_000:

            print(
                "\nWARNING:"
            )

            print(
                f"Expected 50,000 accepted rows but got "
                f"{report.rows_accepted:,}."
            )

        else:

            print(
                "\nSUCCESS:"
            )

            print(
                "All 50,000 rows were accepted."
            )

    except Exception:

        db.rollback()

        print(
            "\n========================================"
        )

        print(
            "IMPORT FAILED"
        )

        print(
            "An exception occurred during import."
        )

        print(
            "The active SQLAlchemy transaction was rolled back."
        )

        print(
            "========================================"
        )

        raise

    finally:

        db.close()


if __name__ == "__main__":
    main()