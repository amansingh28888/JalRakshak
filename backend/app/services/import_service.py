"""
JalRakshak — Import Service
===========================
Handles CSV import, data validation, and database population.
Supports both the real dataset and synthetic demo data.
"""
from __future__ import annotations

import logging
import os
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.water_sample import WaterSample
from app.rules.water_quality_rules import evaluate_sample
from app.rules.standards import AlertCategory

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
    "dadra & nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
    "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
    "daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
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
    if not state:
        return "Unknown"
    return STATE_NORMALIZATION.get(state.strip().lower(), state.strip().title())


def normalize_district(district: Optional[str]) -> str:
    if not district:
        return "Unknown"
    return district.strip().title()


def safe_float(val: Any) -> Optional[float]:
    """Convert to float, return None for missing/invalid values."""
    if val is None:
        return None
    try:
        s = str(val).strip()
        if s in ("", "NA", "N/A", "n/a", "na", "null", "NULL", "NaN", "nan", "-"):
            return None
        f = float(s)
        return f if f >= 0 else None   # negative measurements are invalid
    except (ValueError, TypeError):
        return None


# ── Import report ─────────────────────────────────────────────────────────────

@dataclass
class ImportReport:
    batch_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
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
    rejection_reasons: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
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
            "rejection_reasons_sample": self.rejection_reasons[:20],
            "warnings": self.warnings[:20],
        }


def _validate_row(row: dict, row_idx: int) -> tuple[bool, str]:
    """Return (is_valid, reason). Row must have at least state and district."""
    state = row.get("state_ut")
    district = row.get("district")

    if not state or str(state).strip() in ("", "NA", "N/A", "null"):
        return False, f"Row {row_idx}: Missing state_ut"
    if not district or str(district).strip() in ("", "NA", "N/A", "null"):
        return False, f"Row {row_idx}: Missing district"

    # pH range check
    ph = safe_float(row.get("ph"))
    if ph is not None and (ph < 0 or ph > 14):
        return False, f"Row {row_idx}: Suspicious pH={ph} (outside 0-14)"

    # Negative value checks
    for field_name in ["turbidity_ntu", "tds_mg_l", "fluoride_mg_l",
                        "arsenic_mg_l", "nitrate_mg_l", "e_coli_mpn", "total_coliform_mpn"]:
        val = safe_float(row.get(field_name))
        if val is not None and val < 0:
            return False, f"Row {row_idx}: Negative value for {field_name}={val}"

    # Extreme value checks (suspicious ranges)
    if safe_float(row.get("fluoride_mg_l")) is not None and safe_float(row.get("fluoride_mg_l")) > 50:
        return False, f"Row {row_idx}: Fluoride={row.get('fluoride_mg_l')} > 50 mg/L (suspicious)"
    if safe_float(row.get("arsenic_mg_l")) is not None and safe_float(row.get("arsenic_mg_l")) > 10:
        return False, f"Row {row_idx}: Arsenic={row.get('arsenic_mg_l')} > 10 mg/L (suspicious)"

    return True, ""


def import_samples_from_records(
    records: List[dict],
    db: Session,
    batch_id: Optional[str] = None,
    replace_existing: bool = False,
) -> ImportReport:
    """
    Import a list of pre-mapped records into the database.

    Args:
        records: List of dicts with canonical field names
        db: SQLAlchemy session
        batch_id: Optional batch identifier
        replace_existing: If True, clears existing data first
    """
    report = ImportReport()
    if batch_id:
        report.batch_id = batch_id

    report.rows_received = len(records)

    if replace_existing:
        db.query(WaterSample).delete()
        db.commit()
        logger.info("Cleared existing samples for replacement import.")

    # Track existing sample_ids for duplicate detection
    existing_ids: set = set()
    if not replace_existing:
        for row in db.query(WaterSample.sample_id).all():
            if row.sample_id:
                existing_ids.add(row.sample_id)

    batch = []
    BATCH_SIZE = 500

    for idx, raw in enumerate(records, 1):
        # ── Validate ──────────────────────────────────────────────────────────
        valid, reason = _validate_row(raw, idx)
        if not valid:
            report.rows_rejected += 1
            report.rejection_reasons.append(reason)
            continue

        # ── Check duplicates ──────────────────────────────────────────────────
        sid = raw.get("sample_id")
        if sid and str(sid).strip() in existing_ids:
            report.rows_duplicate += 1
            continue

        # ── Transform ─────────────────────────────────────────────────────────
        transformed = False

        ph_val = safe_float(raw.get("ph"))
        turb_val = safe_float(raw.get("turbidity_ntu"))
        tds_val = safe_float(raw.get("tds_mg_l"))
        f_val = safe_float(raw.get("fluoride_mg_l"))
        as_val = safe_float(raw.get("arsenic_mg_l"))
        no3_val = safe_float(raw.get("nitrate_mg_l"))
        ecoli_val = safe_float(raw.get("e_coli_mpn"))
        tc_val = safe_float(raw.get("total_coliform_mpn"))

        # Handle missing critical fields
        has_any_measurement = any(v is not None for v in [
            ph_val, turb_val, tds_val, f_val, as_val, no3_val, ecoli_val, tc_val
        ])
        if not has_any_measurement:
            report.rows_missing_critical += 1
            report.warnings.append(f"Row {idx}: No measurement values — accepted with warning")
            transformed = True

        # ── Run rule engine ───────────────────────────────────────────────────
        sample_dict = {
            "ph": ph_val,
            "turbidity_ntu": turb_val,
            "tds_mg_l": tds_val,
            "fluoride_mg_l": f_val,
            "arsenic_mg_l": as_val,
            "nitrate_mg_l": no3_val,
            "e_coli_mpn": ecoli_val,
            "total_coliform_mpn": tc_val,
        }
        verdict = evaluate_sample(sample_dict)

        # ── Build ORM object ──────────────────────────────────────────────────
        lat = safe_float(raw.get("latitude"))
        lon = safe_float(raw.get("longitude"))
        location_type = "gps" if (lat is not None and lon is not None) else "administrative"

        sample_obj = WaterSample(
            sample_id=str(sid).strip() if sid else None,
            state_ut=normalize_state(raw.get("state_ut")),
            district=normalize_district(raw.get("district")),
            village=str(raw.get("village", "")).strip() or None,
            water_source_type=str(raw.get("water_source_type", "")).strip() or None,
            season_cycle=str(raw.get("season_cycle", "")).strip() or None,
            sample_date=str(raw.get("sample_date", "")).strip() or None,
            latitude=lat,
            longitude=lon,
            location_type=location_type,
            ph=ph_val,
            turbidity_ntu=turb_val,
            tds_mg_l=tds_val,
            fluoride_mg_l=f_val,
            arsenic_mg_l=as_val,
            nitrate_mg_l=no3_val,
            e_coli_mpn=ecoli_val,
            total_coliform_mpn=tc_val,
            alert_category=verdict.category,
            severity=verdict.severity,
            action_code=verdict.action_code,
            do_not_boil=verdict.do_not_boil,
            primary_contaminant=verdict.primary_contaminant,
            rule_reason="; ".join(verdict.reasons[:3]),
            import_batch=report.batch_id,
        )

        batch.append(sample_obj)
        if sid:
            existing_ids.add(str(sid).strip())

        # ── Update report counters ────────────────────────────────────────────
        report.rows_accepted += 1
        if transformed:
            report.rows_transformed += 1
        if verdict.do_not_boil:
            report.do_not_boil_rows += 1

        cat = verdict.category
        if cat == AlertCategory.POTABLE_SAFE:
            report.safe_rows += 1
        elif cat == AlertCategory.CRITICAL_CHEMICAL_TOXIN:
            report.chemical_alerts += 1
        elif cat == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN:
            report.biological_alerts += 1
        elif cat == AlertCategory.CRITICAL_MIXED_HAZARD:
            report.mixed_hazards += 1
        elif cat == AlertCategory.MODERATE_PHYSICAL_PARAM:
            report.physical_concerns += 1

        # ── Batch flush ───────────────────────────────────────────────────────
        if len(batch) >= BATCH_SIZE:
            db.bulk_save_objects(batch)
            db.commit()
            logger.info(f"  Flushed {len(batch)} records (total accepted: {report.rows_accepted})")
            batch = []

    # Final flush
    if batch:
        db.bulk_save_objects(batch)
        db.commit()
        logger.info(f"  Final flush: {len(batch)} records")

    logger.info(
        f"Import complete — batch={report.batch_id}: "
        f"received={report.rows_received}, accepted={report.rows_accepted}, "
        f"rejected={report.rows_rejected}, duplicates={report.rows_duplicate}"
    )
    return report
