"""
JalRakshak — Analytics Aggregations
Computes dashboard metrics directly from the database.
Never returns fake/hard-coded statistics.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import func, case, distinct
from sqlalchemy.orm import Session

from app.models.water_sample import WaterSample
from app.rules.standards import AlertCategory, ActionCode


def get_dashboard_summary(db: Session) -> Dict[str, Any]:
    """
    Compute all dashboard KPIs from the database.
    All numbers are real database counts — never fabricated.
    """
    stats = db.query(
        func.count(WaterSample.id).label("total"),
        func.sum(case((WaterSample.alert_category == AlertCategory.POTABLE_SAFE, 1), else_=0)).label("safe"),
        func.sum(case((WaterSample.alert_category == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN, 1), else_=0)).label("bio"),
        func.sum(case((WaterSample.alert_category == AlertCategory.CRITICAL_CHEMICAL_TOXIN, 1), else_=0)).label("chem"),
        func.sum(case((WaterSample.alert_category == AlertCategory.MODERATE_PHYSICAL_PARAM, 1), else_=0)).label("phys"),
        func.sum(case((WaterSample.alert_category == AlertCategory.CRITICAL_MIXED_HAZARD, 1), else_=0)).label("mixed"),
        func.sum(case((WaterSample.do_not_boil == True, 1), else_=0)).label("dnb"),
        func.count(distinct(WaterSample.state_ut)).label("states"),
        func.count(distinct(WaterSample.district)).label("districts")
    ).first()

    total = stats.total or 0
    if total == 0:
        return {
            "total_samples": 0,
            "safe_samples": 0,
            "biological_alerts": 0,
            "chemical_alerts": 0,
            "physical_concerns": 0,
            "mixed_hazards": 0,
            "do_not_boil_alerts": 0,
            "safe_percentage": 0.0,
            "do_not_boil_percentage": 0.0,
            "total_states": 0,
            "total_districts": 0,
            "category_distribution": [],
            "source_distribution": [],
            "top_chemical_states": [],
            "severity_distribution": [],
        }

    safe = stats.safe or 0
    bio = stats.bio or 0
    chem = stats.chem or 0
    phys = stats.phys or 0
    mixed = stats.mixed or 0
    dnb = stats.dnb or 0
    states = stats.states or 0
    districts = stats.districts or 0

    # Category distribution
    cat_rows = db.query(
        WaterSample.alert_category,
        func.count(WaterSample.id).label("count")
    ).group_by(WaterSample.alert_category).all()

    category_distribution = [
        {
            "category": row.alert_category or "Unknown",
            "count": row.count,
            "percentage": round(row.count / total * 100, 1) if total else 0,
        }
        for row in cat_rows
    ]

    # Source type distribution
    source_rows = db.query(
        WaterSample.water_source_type,
        func.count(WaterSample.id).label("count")
    ).group_by(WaterSample.water_source_type).all()

    source_distribution = [
        {
            "source": row.water_source_type or "Unknown",
            "count": row.count,
            "percentage": round(row.count / total * 100, 1) if total else 0,
        }
        for row in source_rows
    ]

    # Severity distribution
    sev_rows = db.query(
        WaterSample.severity,
        func.count(WaterSample.id).label("count")
    ).group_by(WaterSample.severity).all()

    severity_distribution = [
        {
            "severity": row.severity or "Unknown",
            "count": row.count,
            "percentage": round(row.count / total * 100, 1) if total else 0,
        }
        for row in sev_rows
    ]

    # Top 10 states by chemical alert count
    state_chem_rows = db.query(
        WaterSample.state_ut,
        func.count(WaterSample.id).label("chemical_count")
    ).filter(
        WaterSample.alert_category == AlertCategory.CRITICAL_CHEMICAL_TOXIN
    ).group_by(WaterSample.state_ut).order_by(
        func.count(WaterSample.id).desc()
    ).limit(10).all()

    top_chemical_states = [
        {"state_ut": row.state_ut, "chemical_alerts": row.chemical_count}
        for row in state_chem_rows
    ]

    return {
        "total_samples": total,
        "safe_samples": safe,
        "biological_alerts": bio,
        "chemical_alerts": chem,
        "physical_concerns": phys,
        "mixed_hazards": mixed,
        "do_not_boil_alerts": dnb,
        "safe_percentage": round(safe / total * 100, 1) if total else 0.0,
        "do_not_boil_percentage": round(dnb / total * 100, 1) if total else 0.0,
        "total_states": states,
        "total_districts": districts,
        "category_distribution": category_distribution,
        "source_distribution": source_distribution,
        "severity_distribution": severity_distribution,
        "top_chemical_states": top_chemical_states,
    }


def get_state_stats(db: Session) -> List[Dict[str, Any]]:
    """Per-state breakdown of all categories."""
    rows = db.query(
        WaterSample.state_ut,
        func.count(WaterSample.id).label("total"),
        func.sum(case((WaterSample.alert_category == AlertCategory.POTABLE_SAFE, 1), else_=0)).label("safe"),
        func.sum(case((WaterSample.alert_category == AlertCategory.CRITICAL_CHEMICAL_TOXIN, 1), else_=0)).label("chemical"),
        func.sum(case((WaterSample.alert_category == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN, 1), else_=0)).label("biological"),
        func.sum(case((WaterSample.alert_category == AlertCategory.MODERATE_PHYSICAL_PARAM, 1), else_=0)).label("physical"),
        func.sum(case((WaterSample.alert_category == AlertCategory.CRITICAL_MIXED_HAZARD, 1), else_=0)).label("mixed"),
        func.sum(case((WaterSample.do_not_boil == True, 1), else_=0)).label("do_not_boil"),
    ).group_by(WaterSample.state_ut).order_by(func.count(WaterSample.id).desc()).all()

    return [
        {
            "state_ut": r.state_ut,
            "total": r.total,
            "safe": r.safe,
            "chemical": r.chemical,
            "biological": r.biological,
            "physical": r.physical,
            "mixed": r.mixed,
            "do_not_boil": r.do_not_boil,
        }
        for r in rows
    ]


def get_district_stats(db: Session, state_ut: Optional[str] = None) -> List[Dict[str, Any]]:
    """Per-district breakdown."""
    q = db.query(
        WaterSample.state_ut,
        WaterSample.district,
        func.count(WaterSample.id).label("total"),
        func.sum(case((WaterSample.do_not_boil == True, 1), else_=0)).label("do_not_boil"),
        func.sum(case((WaterSample.alert_category == AlertCategory.CRITICAL_CHEMICAL_TOXIN, 1), else_=0)).label("chemical"),
        func.sum(case((WaterSample.alert_category == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN, 1), else_=0)).label("biological"),
        func.sum(case((WaterSample.alert_category == AlertCategory.CRITICAL_MIXED_HAZARD, 1), else_=0)).label("mixed"),
    ).group_by(WaterSample.state_ut, WaterSample.district)

    if state_ut:
        q = q.filter(WaterSample.state_ut == state_ut)

    q = q.order_by(func.count(WaterSample.id).desc()).limit(100)

    return [
        {
            "state_ut": r.state_ut,
            "district": r.district,
            "total": r.total,
            "do_not_boil": r.do_not_boil,
            "chemical": r.chemical,
            "biological": r.biological,
            "mixed": r.mixed,
        }
        for r in q.all()
    ]
