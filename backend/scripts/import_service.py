"""
JalRakshak — Import Service
===========================

Handles:
- CSV data transformation
- Validation
- Duplicate detection
- Deterministic rule-engine evaluation
- SQLite database population
- Import statistics / audit reporting

IMPORTANT:
The CSV's pre-existing classification columns are NOT trusted
as the final safety authority.

Safety classification is always recalculated by:
    measured values
        ↓
    deterministic rule engine
        ↓
    category + action_code + do_not_boil
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from typing import Any, List, Optional

from sqlalchemy.orm import Session

from app.models.water_sample import WaterSample
from app.rules.standards import AlertCategory
from app.rules.water_quality_rules import evaluate_sample


logger = logging.getLogger(__name__)


# ── State name normalization ──────────────────────────────────────────────────

STATE_NORMALIZATION = {
    "andaman & nicobar islands": "Andaman and Nicobar Islands",
    "andaman and nicobar": "Andaman and Nicobar Islands",
    "andhra pradesh": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh",
    "assam": "Assam",
    "bihar": "Bihar",
    "chandigarh": "Chandigarh",
    "chhattisgarh": "Chhattisgarh",

    "dadra & nagar haveli":
        "Dadra and Nagar Haveli and Daman and Diu",

    "dadra and nagar haveli":
        "Dadra and Nagar Haveli and Daman and Diu",

    "daman & diu":
        "Dadra and Nagar Haveli and Daman and Diu",

    "delhi": "Delhi",
    "goa": "Goa",
    "gujarat": "Gujarat",
    "haryana": "Haryana",
    "himachal pradesh": "Himachal Pradesh",

    "jammu & kashmir": "Jammu and Kashmir",
    "jammu and kashmir": "Jammu and Kashmir",

    "jharkhand": "Jharkhand",
    "karnataka": "Karnataka",
    "kerala": "Kerala",
    "ladakh": "Ladakh",
    "lakshadweep": "Lakshadweep",
    "madhya pradesh": "Madhya Pradesh",
    "maharashtra": "Maharashtra",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "odisha": "Odisha",
    "orissa": "Odisha",
    "puducherry": "Puducherry",
    "pondicherry": "Puducherry",
    "punjab": "Punjab",
    "rajasthan": "Rajasthan",
    "sikkim": "Sikkim",
    "tamil nadu": "Tamil Nadu",
    "tamilnadu": "Tamil Nadu",
    "telangana": "Telangana",
    "tripura": "Tripura",
    "uttar pradesh": "Uttar Pradesh",
    "up": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand",
    "uttaranchal": "Uttarakhand",
    "west bengal": "West Bengal",
}


def normalize_state(state: Optional[str]) -> str:
    """Normalize State/UT names."""
    if not state:
        return "Unknown"

    value = str(state).strip()

    if not value:
        return "Unknown"

    return STATE_NORMALIZATION.get(
        value.lower(),
        value.title(),
    )


def normalize_district(district: Optional[str]) -> str:
    """Normalize district name."""
    if not district:
        return "Unknown"

    value = str(district).strip()

    if not value:
        return "Unknown"

    return value.title()


# ── Numeric conversion ────────────────────────────────────────────────────────

def safe_float(val: Any) -> Optional[float]:
    """
    Convert a value to a non-negative float.

    Missing/invalid values return None.

    Examples:
        "12.5" -> 12.5
        12.5   -> 12.5
        ""     -> None
        "NA"   -> None
        None   -> None
        -5     -> None
    """

    if val is None:
        return None

    try:
        value = str(val).strip()

        if value.lower() in {
            "",
            "na",
            "n/a",
            "null",
            "nan",
            "-",
        }:
            return None

        number = float(value)

        if number < 0:
            return None

        return number

    except (ValueError, TypeError):
        return None


# ── Import Report ─────────────────────────────────────────────────────────────

@dataclass
class ImportReport:

    batch_id: str = field(
        default_factory=lambda: str(uuid.uuid4())[:8].upper()
    )

    rows_received: int = 0
    rows_accepted: int = 0
    rows_rejected: int = 0
    rows_duplicate: int = 0
    rows_missing_critical: int = 0
    rows_transformed: int = 0

    chemical_alerts: int = 0
    biological_alerts: int = 0
    mixed_hazards: int = 0
    safe_rows: int = 0
    physical_concerns: int = 0
    do_not_boil_rows: int = 0

    rejection_reasons: List[str] = field(
        default_factory=list
    )

    warnings: List[str] = field(
        default_factory=list
    )

    def to_dict(self) -> dict:
        """Return JSON-friendly import report."""

        return {
            "batch_id": self.batch_id,
            "rows_received": self.rows_received,
            "rows_accepted": self.rows_accepted,
            "rows_rejected": self.rows_rejected,
            "rows_duplicate": self.rows_duplicate,
            "rows_missing_critical": self.rows_missing_critical,
            "rows_transformed": self.rows_transformed,

            "chemical_alerts": self.chemical_alerts,
            "biological_alerts": self.biological_alerts,
            "mixed_hazards": self.mixed_hazards,
            "physical_concerns": self.physical_concerns,
            "safe_rows": self.safe_rows,
            "do_not_boil_rows": self.do_not_boil_rows,

            "rejection_reasons_sample":
                self.rejection_reasons[:20],

            "warnings":
                self.warnings[:20],
        }


# ── Row validation ───────────────────────────────────────────────────────────

def _validate_row(
    row: dict,
    row_idx: int,
) -> tuple[bool, str]:
    """
    Validate one already-mapped record.

    Minimum required:
    - state_ut
    - district

    Numeric values must be non-negative.
    """

    state = row.get("state_ut")
    district = row.get("district")

    if not state or str(state).strip().lower() in {
        "",
        "na",
        "n/a",
        "null",
    }:
        return False, f"Row {row_idx}: Missing state_ut"

    if not district or str(district).strip().lower() in {
        "",
        "na",
        "n/a",
        "null",
    }:
        return False, f"Row {row_idx}: Missing district"

    # ── pH validation ────────────────────────────────────────────────────────

    ph = safe_float(row.get("ph"))

    if ph is not None and not 0 <= ph <= 14:
        return (
            False,
            f"Row {row_idx}: Suspicious pH={ph} "
            f"(outside 0-14)",
        )

    # ── Numeric measurement validation ───────────────────────────────────────

    numeric_fields = [
        "turbidity_ntu",
        "tds_mg_l",
        "total_hardness_mg_l",
        "chloride_mg_l",
        "fluoride_mg_l",
        "arsenic_mg_l",
        "arsenic_ug_l",
        "nitrate_mg_l",
        "iron_mg_l",
        "uranium_ug_l",
        "uranium_mg_l",
        "e_coli_mpn",
        "total_coliform_mpn",
    ]

    for field_name in numeric_fields:

        raw_value = row.get(field_name)

        if raw_value is None:
            continue

        value_text = str(raw_value).strip()

        if value_text.lower() in {
            "",
            "na",
            "n/a",
            "null",
            "nan",
            "-",
        }:
            continue

        try:
            value = float(value_text)
        except (ValueError, TypeError):
            return (
                False,
                f"Row {row_idx}: Invalid numeric value "
                f"for {field_name}={raw_value!r}",
            )

        if value < 0:
            return (
                False,
                f"Row {row_idx}: Negative value for "
                f"{field_name}={value}",
            )

    # ── Suspicious chemical ranges ───────────────────────────────────────────

    fluoride = safe_float(row.get("fluoride_mg_l"))

    if fluoride is not None and fluoride > 50:
        return (
            False,
            f"Row {row_idx}: Fluoride={fluoride} "
            f"> 50 mg/L (suspicious)",
        )

    arsenic = safe_float(row.get("arsenic_mg_l"))

    if arsenic is not None and arsenic > 10:
        return (
            False,
            f"Row {row_idx}: Arsenic={arsenic} "
            f"> 10 mg/L (suspicious)",
        )

    return True, ""


# ── Import records ────────────────────────────────────────────────────────────

def import_samples_from_records(
    records: List[dict],
    db: Session,
    batch_id: Optional[str] = None,
    replace_existing: bool = False,
) -> ImportReport:
    """
    Import pre-mapped records into SQLite.

    The safety classification is recalculated from measured values
    using evaluate_sample().

    CSV classification fields such as:
        alert_category
        action_code
        do_not_boil
        is_potable

    are NOT trusted as the final safety decision.
    """

    report = ImportReport()

    if batch_id:
        report.batch_id = batch_id

    report.rows_received = len(records)

    # ── Optional replacement import ──────────────────────────────────────────

    if replace_existing:

        db.query(WaterSample).delete()
        db.commit()

        logger.info(
            "Cleared existing water_samples "
            "for replacement import."
        )

    # ── Existing sample IDs ───────────────────────────────────────────────────

    existing_ids: set[str] = set()

    if not replace_existing:

        existing_rows = (
            db.query(WaterSample.sample_id)
            .filter(WaterSample.sample_id.isnot(None))
            .all()
        )

        existing_ids = {
            str(row.sample_id).strip()
            for row in existing_rows
            if row.sample_id
        }

    # ── Batch insertion ──────────────────────────────────────────────────────

    batch: list[WaterSample] = []
    BATCH_SIZE = 500

    for idx, raw in enumerate(records, start=1):

        # ================================================================
        # 1. VALIDATE
        # ================================================================

        valid, reason = _validate_row(
            raw,
            idx,
        )

        if not valid:

            report.rows_rejected += 1

            if len(report.rejection_reasons) < 100:
                report.rejection_reasons.append(reason)

            continue

        # ================================================================
        # 2. DUPLICATE CHECK
        # ================================================================

        sid = raw.get("sample_id")

        if sid:

            sid = str(sid).strip()

            if sid in existing_ids:

                report.rows_duplicate += 1
                continue

        # ================================================================
        # 3. READ + TRANSFORM MEASUREMENTS
        # ================================================================

        ph_val = safe_float(
            raw.get("ph")
        )

        turbidity_val = safe_float(
            raw.get("turbidity_ntu")
        )

        tds_val = safe_float(
            raw.get("tds_mg_l")
        )

        hardness_val = safe_float(
            raw.get("total_hardness_mg_l")
        )

        chloride_val = safe_float(
            raw.get("chloride_mg_l")
        )

        fluoride_val = safe_float(
            raw.get("fluoride_mg_l")
        )

        arsenic_mg_val = safe_float(
            raw.get("arsenic_mg_l")
        )

        arsenic_ug_val = safe_float(
            raw.get("arsenic_ug_l")
        )

        nitrate_val = safe_float(
            raw.get("nitrate_mg_l")
        )

        iron_val = safe_float(
            raw.get("iron_mg_l")
        )

        uranium_ug_val = safe_float(
            raw.get("uranium_ug_l")
        )

        uranium_mg_val = safe_float(
            raw.get("uranium_mg_l")
        )

        ecoli_val = safe_float(
            raw.get("e_coli_mpn")
        )

        total_coliform_val = safe_float(
            raw.get("total_coliform_mpn")
        )

        # ================================================================
        # 4. UNIT CONSISTENCY FALLBACKS
        # ================================================================
        #
        # The real CSV already supplies both arsenic and uranium units.
        # These fallbacks help other CSV formats while preserving
        # standardized units.
        #

        transformed = False

        if (
            arsenic_ug_val is None
            and arsenic_mg_val is not None
        ):
            arsenic_ug_val = arsenic_mg_val * 1000
            transformed = True

        if (
            arsenic_mg_val is None
            and arsenic_ug_val is not None
        ):
            arsenic_mg_val = arsenic_ug_val / 1000
            transformed = True

        if (
            uranium_ug_val is None
            and uranium_mg_val is not None
        ):
            uranium_ug_val = uranium_mg_val * 1000
            transformed = True

        if (
            uranium_mg_val is None
            and uranium_ug_val is not None
        ):
            uranium_mg_val = uranium_ug_val / 1000
            transformed = True

        # ================================================================
        # 5. MEASUREMENT PRESENCE CHECK
        # ================================================================

        measurement_values = [
            ph_val,
            turbidity_val,
            tds_val,
            hardness_val,
            chloride_val,
            fluoride_val,
            arsenic_mg_val,
            nitrate_val,
            iron_val,
            uranium_ug_val,
            ecoli_val,
            total_coliform_val,
        ]

        if not any(
            value is not None
            for value in measurement_values
        ):

            report.rows_missing_critical += 1

            if len(report.warnings) < 100:
                report.warnings.append(
                    f"Row {idx}: No measurement values "
                    f"— accepted with warning"
                )

            transformed = True

        # ================================================================
        # 6. DETERMINISTIC RULE ENGINE
        # ================================================================

        sample_dict = {
            "ph": ph_val,
            "turbidity_ntu": turbidity_val,
            "tds_mg_l": tds_val,

            "total_hardness_mg_l": hardness_val,
            "chloride_mg_l": chloride_val,

            "fluoride_mg_l": fluoride_val,

            "arsenic_mg_l": arsenic_mg_val,
            "arsenic_ug_l": arsenic_ug_val,

            "nitrate_mg_l": nitrate_val,

            "iron_mg_l": iron_val,

            "uranium_ug_l": uranium_ug_val,
            "uranium_mg_l": uranium_mg_val,

            "e_coli_mpn": ecoli_val,
            "total_coliform_mpn": total_coliform_val,
        }

        verdict = evaluate_sample(
            sample_dict
        )

        # ================================================================
        # 7. LOCATION
        # ================================================================

        latitude = safe_float(
            raw.get("latitude")
        )

        longitude = safe_float(
            raw.get("longitude")
        )

        location_type = (
            "gps"
            if latitude is not None
            and longitude is not None
            else "administrative"
        )

        # ================================================================
        # 8. DATABASE OBJECT
        # ================================================================

        sample_obj = WaterSample(

            # Identity
            sample_id=(
                str(sid).strip()
                if sid
                else None
            ),

            # Location
            state_ut=normalize_state(
                raw.get("state_ut")
            ),

            district=normalize_district(
                raw.get("district")
            ),

            village=(
                str(raw.get("village", "")).strip()
                or None
            ),

            water_source_type=(
                str(
                    raw.get("water_source_type", "")
                ).strip()
                or None
            ),

            # Temporal
            season_cycle=(
                str(
                    raw.get("season_cycle", "")
                ).strip()
                or None
            ),

            sample_date=(
                str(
                    raw.get("sample_date", "")
                ).strip()
                or None
            ),

            # Geospatial
            latitude=latitude,
            longitude=longitude,
            location_type=location_type,

            # Physical
            ph=ph_val,
            turbidity_ntu=turbidity_val,
            tds_mg_l=tds_val,
            total_hardness_mg_l=hardness_val,
            chloride_mg_l=chloride_val,

            # Chemical
            fluoride_mg_l=fluoride_val,
            arsenic_mg_l=arsenic_mg_val,
            arsenic_ug_l=arsenic_ug_val,
            nitrate_mg_l=nitrate_val,
            iron_mg_l=iron_val,
            uranium_ug_l=uranium_ug_val,
            uranium_mg_l=uranium_mg_val,

            # Biological
            e_coli_mpn=ecoli_val,
            total_coliform_mpn=total_coliform_val,

            # Deterministic classification
            alert_category=verdict.category,
            severity=verdict.severity,
            action_code=verdict.action_code,
            do_not_boil=verdict.do_not_boil,
            primary_contaminant=(
                verdict.primary_contaminant
            ),
            rule_reason="; ".join(
                verdict.reasons[:3]
            ),

            # Audit
            import_batch=report.batch_id,
        )

        batch.append(sample_obj)

        if sid:
            existing_ids.add(
                str(sid).strip()
            )

        # ================================================================
        # 9. REPORT COUNTERS
        # ================================================================

        report.rows_accepted += 1

        if transformed:
            report.rows_transformed += 1

        if verdict.do_not_boil:
            report.do_not_boil_rows += 1

        category = verdict.category

        if category == AlertCategory.POTABLE_SAFE:

            report.safe_rows += 1

        elif category == AlertCategory.CRITICAL_CHEMICAL_TOXIN:

            report.chemical_alerts += 1

        elif category == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN:

            report.biological_alerts += 1

        elif category == AlertCategory.CRITICAL_MIXED_HAZARD:

            report.mixed_hazards += 1

        elif category == AlertCategory.MODERATE_PHYSICAL_PARAM:

            report.physical_concerns += 1

        # ================================================================
        # 10. BATCH FLUSH
        # ================================================================

        if len(batch) >= BATCH_SIZE:

            db.bulk_save_objects(
                batch
            )

            db.commit()

            logger.info(
                "Flushed %s records "
                "(accepted=%s)",
                len(batch),
                report.rows_accepted,
            )

            batch = []

    # ================================================================
    # 11. FINAL FLUSH
    # ================================================================

    if batch:

        db.bulk_save_objects(
            batch
        )

        db.commit()

        logger.info(
            "Final flush: %s records",
            len(batch),
        )

    logger.info(
        "Import complete — "
        "batch=%s received=%s accepted=%s "
        "rejected=%s duplicates=%s",
        report.batch_id,
        report.rows_received,
        report.rows_accepted,
        report.rows_rejected,
        report.rows_duplicate,
    )

    return report