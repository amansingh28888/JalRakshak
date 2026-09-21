"""Alerts API — high-priority alert listing."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.water_sample import WaterSample
from app.rules.standards import AlertCategory, Severity

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    do_not_boil_only: bool = Query(False),
    critical_only: bool = Query(False),
    category: Optional[str] = Query(None, description="Filter by alert category"),
    state: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List alerts with optional filtering by category, severity, state."""
    q = db.query(WaterSample).filter(
        WaterSample.alert_category != AlertCategory.POTABLE_SAFE
    )

    if do_not_boil_only:
        q = q.filter(WaterSample.do_not_boil == True)

    if critical_only:
        q = q.filter(WaterSample.severity == Severity.CRITICAL)

    if category:
        q = q.filter(WaterSample.alert_category == category)

    if state:
        q = q.filter(WaterSample.state_ut.ilike(f"%{state}%"))

    # Sort: mixed hazards first, then chemical, then biological
    q = q.order_by(WaterSample.do_not_boil.desc(), WaterSample.severity.desc())

    total = q.count()
    pages = max(1, (total + page_size - 1) // page_size)
    items = q.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total":     total,
        "page":      page,
        "page_size": page_size,
        "pages":     pages,
        "items":     [_alert_row(s) for s in items],
    }


def _alert_row(s: WaterSample) -> dict:
    """Build alert row including message_type derived from category."""
    # Derive message_type from stored category for backward compatibility
    # (stored records don't have message_type column)
    _CATEGORY_TO_MESSAGE_TYPE = {
        AlertCategory.POTABLE_SAFE:              "SAFE",
        AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN:"BIOLOGICAL_CONTAMINATION",
        AlertCategory.CRITICAL_CHEMICAL_TOXIN:   "CHEMICAL_CONTAMINATION",
        AlertCategory.MODERATE_PHYSICAL_PARAM:   "PHYSICAL_PARAMETER",
        AlertCategory.CRITICAL_MIXED_HAZARD:     "MIXED_HAZARD",
    }
    message_type = _CATEGORY_TO_MESSAGE_TYPE.get(
        s.alert_category or "", "CHEMICAL_CONTAMINATION"
    )

    # Derive safe_to_drink from category
    safe_to_drink = (s.alert_category == AlertCategory.POTABLE_SAFE)

    # Derive recommended_actions from action_code / category
    _CATEGORY_TO_REC_ACTIONS = {
        AlertCategory.POTABLE_SAFE:               [],
        AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN: ["BOIL_OR_CHLORINATE", "DISINFECT_BEFORE_DRINKING"],
        AlertCategory.CRITICAL_CHEMICAL_TOXIN:    ["USE_ALTERNATIVE_SAFE_SOURCE", "USE_APPROPRIATE_CHEMICAL_TREATMENT"],
        AlertCategory.MODERATE_PHYSICAL_PARAM:    ["FILTER_OR_TREAT", "RETEST"],
        AlertCategory.CRITICAL_MIXED_HAZARD:      ["USE_ALTERNATIVE_SAFE_SOURCE", "USE_APPROPRIATE_CHEMICAL_TREATMENT", "DISINFECT_FOR_BIOLOGICAL_CONTAMINATION"],
    }
    recommended_actions = _CATEGORY_TO_REC_ACTIONS.get(s.alert_category or "", [])

    # Derive avoid_actions
    avoid_actions = (
        ["DO_NOT_RELY_ON_BOILING"]
        if s.do_not_boil
        else []
    )

    return {
        "id":                  s.id,
        "sample_id":           s.sample_id,
        "state_ut":            s.state_ut,
        "district":            s.district,
        "village":             s.village,
        "water_source_type":   s.water_source_type,
        "alert_category":      s.alert_category,
        "severity":            s.severity,
        "action_code":         s.action_code,
        "do_not_boil":         s.do_not_boil,
        "primary_contaminant": s.primary_contaminant,
        "rule_reason":         s.rule_reason,
        "sample_date":         s.sample_date,
        # New structured communication fields (derived deterministically)
        "message_type":        message_type,
        "safe_to_drink":       safe_to_drink,
        "recommended_actions": recommended_actions,
        "avoid_actions":       avoid_actions,
    }
