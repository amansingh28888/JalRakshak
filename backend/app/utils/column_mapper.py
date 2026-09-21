"""
JalRakshak — CSV Column Mapper

Maps dataset CSV column names to the canonical
field names used by the JalRakshak backend.

This file contains mapping/configuration only.
No water-quality business logic belongs here.
"""

from __future__ import annotations


# Canonical backend field -> possible CSV column names
#
# Matching is case-insensitive.
# Leading/trailing whitespace is ignored.
#
# First matching alias wins.

COLUMN_MAP: dict[str, list[str]] = {

    # ─────────────────────────────────────────────────────────────
    # Identity
    # ─────────────────────────────────────────────────────────────

    "sample_id": [
        "sample_id",
        "sampleid",
        "record_id",
        "id",
        "sample id",
        "slno",
        "sl_no",
        "sr_no",
    ],

    # ─────────────────────────────────────────────────────────────
    # Location
    # ─────────────────────────────────────────────────────────────

    "state_ut": [
        "state_ut",
        "state/ut",
        "state",
        "statename",
        "state name",
        "state_name",
        "ut",
        "statut",
    ],

    "district": [
        "district",
        "districtname",
        "district name",
        "district_name",
        "dist",
    ],

    "village": [
        "village",
        "villagename",
        "village name",
        "city_or_town",
        "city/town",
        "locality",
        "location",
        "habitation",
        "sub_district",
        "subdistrict",
        "block",
    ],

    # ─────────────────────────────────────────────────────────────
    # Water source
    # ─────────────────────────────────────────────────────────────

    "water_source_type": [
        "water_source_type",
        "watersourcetype",
        "source_type",
        "sourcetype",
        "source",
        "water source",
        "water_source",
        "type_of_source",
        "type of source",
        "sourcename",
    ],

    # ─────────────────────────────────────────────────────────────
    # Monitoring / date
    # ─────────────────────────────────────────────────────────────

    "season_cycle": [
        "season_cycle",
        "seasoncycle",
        "season",
        "cycle",
        "monitoring_cycle",
        "testing_cycle",
        "phase",
        "period",
    ],

    "sample_date": [
        "sample_date",
        "sampledate",
        "date",
        "sample date",
        "testing_date",
        "collection_date",
        "year",
    ],

    # ─────────────────────────────────────────────────────────────
    # Coordinates
    # ─────────────────────────────────────────────────────────────

    "latitude": [
        "latitude",
        "lat",
        "y",
        "y_coord",
    ],

    "longitude": [
        "longitude",
        "lon",
        "long",
        "lng",
        "x",
        "x_coord",
    ],

    # ─────────────────────────────────────────────────────────────
    # Physical parameters
    # ─────────────────────────────────────────────────────────────

    "ph": [
        "ph",
        "pH",
        "ph_value",
        "ph value",
        "p_h",
    ],

    "turbidity_ntu": [
        "turbidity_ntu",
        "turbidity_NTU",
        "turbidity",
        "turb",
        "turbidity(ntu)",
        "turbidity (ntu)",
        "ntu",
    ],

    "tds_mg_l": [
        "tds_mg_l",
        "tds_mg_L",
        "tds",
        "total_dissolved_solids",
        "total dissolved solids",
        "tds(mg/l)",
        "tds (mg/l)",
        "tds_mgl",
    ],

    "total_hardness_mg_l": [
        "total_hardness_mg_l",
        "total_hardness_mg_L",
        "total_hardness",
        "hardness",
        "total hardness",
        "total hardness (mg/l)",
    ],

    "chloride_mg_l": [
        "chloride_mg_l",
        "chloride_mg_L",
        "chloride",
        "cl",
        "chloride(mg/l)",
        "chloride (mg/l)",
    ],

    # ─────────────────────────────────────────────────────────────
    # Chemical parameters
    # ─────────────────────────────────────────────────────────────

    "fluoride_mg_l": [
        "fluoride_mg_l",
        "fluoride_mg_L",
        "fluoride",
        "f",
        "fluoride(mg/l)",
        "fluoride (mg/l)",
        "fluoride_mgl",
        "fluride",
    ],

    "arsenic_ug_l": [
        "arsenic_ug_l",
        "arsenic_ug_L",
        "arsenic_ug",
        "arsenic (ug/l)",
        "arsenic (µg/l)",
        "arsenic_µg_l",
    ],

    "arsenic_mg_l": [
        "arsenic_mg_l",
        "arsenic_mg_L",
        "arsenic",
        "as",
        "arsenic(mg/l)",
        "arsenic (mg/l)",
        "arsenic_mgl",
    ],

    "nitrate_mg_l": [
        "nitrate_mg_l",
        "nitrate_mg_L",
        "nitrate",
        "no3",
        "nitrate(mg/l)",
        "nitrate (mg/l)",
        "nitrate_mgl",
        "nitrate_as_no3",
    ],

    "iron_mg_l": [
        "iron_mg_l",
        "iron_mg_L",
        "iron",
        "fe",
        "iron(mg/l)",
        "iron (mg/l)",
        "iron_mgl",
    ],

    "uranium_ug_l": [
        "uranium_ug_l",
        "uranium_ug_L",
        "uranium_ug",
        "uranium (ug/l)",
        "uranium (µg/l)",
        "uranium_µg_l",
    ],

    "uranium_mg_l": [
        "uranium_mg_l",
        "uranium_mg_L",
        "uranium_mg",
        "uranium(mg/l)",
        "uranium (mg/l)",
        "uranium_mgl",
    ],

    # ─────────────────────────────────────────────────────────────
    # Microbiological parameters
    # ─────────────────────────────────────────────────────────────

    "e_coli_mpn": [
        "e_coli_mpn",
        "e_coli",
        "ecoli",
        "e.coli",
        "e coli",
        "e_coli(mpn/100ml)",
        "e_coli (mpn/100ml)",
        "ecoli_mpn",
        "e.coli mpn",
        "fecal_coliform",
        "fecal coliform",
        "fecal_coliform_MPN_100mL",
    ],

    "total_coliform_mpn": [
        "total_coliform_mpn",
        "total_coliform",
        "totalcoliform",
        "total coliform",
        "coliform",
        "tc",
        "total_coliform(mpn/100ml)",
        "total_coliform (mpn/100ml)",
        "coliform_mpn",
    ],
}


def build_reverse_map(
    df_columns: list[str],
) -> dict[str, str]:
    """
    Build:
        CSV column name -> canonical backend field

    Example:
        record_id -> sample_id
        iron_mg_L -> iron_mg_l
        uranium_ug_L -> uranium_ug_l
    """

    normalized_actual = {
        str(column).strip().lower(): column
        for column in df_columns
    }

    reverse: dict[str, str] = {}

    for canonical, aliases in COLUMN_MAP.items():

        for alias in aliases:

            normalized_alias = (
                str(alias).strip().lower()
            )

            if normalized_alias in normalized_actual:

                original_column = (
                    normalized_actual[normalized_alias]
                )

                reverse[original_column] = canonical

                break

    return reverse


def get_mapped_columns() -> list[str]:
    """Return all canonical backend field names."""
    return list(COLUMN_MAP.keys())