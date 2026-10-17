"""
JalRakshak — Analytics Aggregations
Computes dashboard metrics directly from the database.
Never returns fake/hard-coded statistics.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import func, case, distinct, text, or_
from sqlalchemy.orm import Session

from app.models.water_sample import WaterSample
from app.rules.standards import AlertCategory, Severity, ActionCode


STATE_CODE_MAP = {
    'PB': 'Punjab', 'HR': 'Haryana', 'UP': 'Uttar Pradesh', 'RJ': 'Rajasthan',
    'MH': 'Maharashtra', 'DL': 'Delhi', 'GJ': 'Gujarat', 'KA': 'Karnataka',
    'KL': 'Kerala', 'TN': 'Tamil Nadu', 'WB': 'West Bengal', 'MP': 'Madhya Pradesh',
    'BR': 'Bihar', 'AP': 'Andhra Pradesh', 'TG': 'Telangana', 'TS': 'Telangana',
    'OR': 'Odisha', 'OD': 'Odisha', 'JH': 'Jharkhand', 'AS': 'Assam',
    'UK': 'Uttarakhand', 'UT': 'Uttarakhand', 'HP': 'Himachal Pradesh',
    'JK': 'Jammu and Kashmir', 'GA': 'Goa', 'TR': 'Tripura', 'MN': 'Manipur',
    'ML': 'Meghalaya', 'MZ': 'Mizoram', 'NL': 'Nagaland', 'SK': 'Sikkim',
    'AR': 'Arunachal Pradesh', 'CH': 'Chandigarh', 'PY': 'Puducherry',
    'LA': 'Ladakh', 'LD': 'Lakshadweep', 'CG': 'Chhattisgarh', 'CT': 'Chhattisgarh'
}


def resolve_state_name(db: Session, state_input: Optional[str]) -> Optional[str]:
    """
    Normalizes any state identifier (state name, 2-letter abbreviation, or numeric state_id)
    to the canonical state name stored in WaterSample.state_ut.
    Returns None for 'all', 'national', 'all india', None, or empty string.
    """
    if not state_input:
        return None
    s = str(state_input).strip()
    if not s or s.lower() in ('all', 'all-india', 'all india', 'india', 'national'):
        return None

    # Check 2-letter state code
    if len(s) == 2 and s.upper() in STATE_CODE_MAP:
        return STATE_CODE_MAP[s.upper()]

    # Check numeric state_id (e.g. '20', '08') from locations table
    if s.isdigit():
        try:
            padded = f"{int(s):02d}"
            row = db.execute(
                text("SELECT state_name FROM locations WHERE state_id = :sid LIMIT 1"),
                {"sid": padded}
            ).first()
            if not row:
                row = db.execute(
                    text("SELECT state_name FROM locations WHERE state_id = :sid LIMIT 1"),
                    {"sid": s}
                ).first()
            if row and row[0]:
                return row[0]
        except Exception:
            pass

    # Exact case-insensitive match against WaterSample.state_ut
    exact = db.query(WaterSample.state_ut).filter(WaterSample.state_ut.ilike(s)).first()
    if exact and exact[0]:
        return exact[0]

    # Partial match
    partial = db.query(WaterSample.state_ut).filter(WaterSample.state_ut.ilike(f"%{s}%")).first()
    if partial and partial[0]:
        return partial[0]

    return s


def get_dashboard_summary(
    db: Session,
    state: Optional[str] = None,
    district: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compute dashboard KPIs from the database, optionally filtered by state or district.
    All numbers are real database counts — never fabricated.
    """
    resolved_state = resolve_state_name(db, state)
    clean_district = district.strip() if district and district.strip() else None

    base_filter = []
    if resolved_state:
        base_filter.append(WaterSample.state_ut == resolved_state)
    if clean_district:
        base_filter.append(WaterSample.district.ilike(f"%{clean_district}%"))

    # Track any records with missing or invalid state mapping
    missing_loc_count = db.query(func.count(WaterSample.id)).filter(
        or_(
            WaterSample.state_ut == None,
            WaterSample.state_ut == "",
            WaterSample.state_ut == "Unknown"
        )
    ).scalar() or 0

    stats_q = db.query(
        func.count(WaterSample.id).label("total"),
        func.sum(case((WaterSample.alert_category == AlertCategory.POTABLE_SAFE, 1), else_=0)).label("safe"),
        func.sum(case((WaterSample.alert_category == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN, 1), else_=0)).label("bio"),
        func.sum(case((WaterSample.alert_category == AlertCategory.CRITICAL_CHEMICAL_TOXIN, 1), else_=0)).label("chem"),
        func.sum(case((WaterSample.alert_category == AlertCategory.MODERATE_PHYSICAL_PARAM, 1), else_=0)).label("phys"),
        func.sum(case((WaterSample.alert_category == AlertCategory.CRITICAL_MIXED_HAZARD, 1), else_=0)).label("mixed"),
        func.sum(case((WaterSample.do_not_boil == True, 1), else_=0)).label("dnb"),
        func.count(distinct(WaterSample.state_ut)).label("states"),
        func.count(distinct(WaterSample.district)).label("districts")
    )
    if base_filter:
        stats_q = stats_q.filter(*base_filter)
    stats = stats_q.first()

    total = stats.total or 0
    if total == 0:
        return {
            "total_samples": 0,
            "safe_samples": 0,
            "unsafe_samples": 0,
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
            "severity_distribution": [],
            "top_chemical_states": [],
            "severity_by_location": [],
            "monthly_trends": [],
            "parameter_health": [],
            "missing_location_count": missing_loc_count,
            "filter_state": resolved_state,
            "filter_district": clean_district,
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
    cat_q = db.query(
        WaterSample.alert_category,
        func.count(WaterSample.id).label("count")
    )
    if base_filter:
        cat_q = cat_q.filter(*base_filter)
    cat_rows = cat_q.group_by(WaterSample.alert_category).all()

    category_distribution = [
        {
            "category": row.alert_category or "Unknown",
            "count": row.count,
            "percentage": round(row.count / total * 100, 1) if total else 0,
        }
        for row in cat_rows
    ]

    # Source type distribution
    source_q = db.query(
        WaterSample.water_source_type,
        func.count(WaterSample.id).label("count")
    )
    if base_filter:
        source_q = source_q.filter(*base_filter)
    source_rows = source_q.group_by(WaterSample.water_source_type).all()

    source_distribution = [
        {
            "source": row.water_source_type or "Unknown",
            "count": row.count,
            "percentage": round(row.count / total * 100, 1) if total else 0,
        }
        for row in source_rows
    ]

    # Severity distribution
    sev_q = db.query(
        WaterSample.severity,
        func.count(WaterSample.id).label("count")
    )
    if base_filter:
        sev_q = sev_q.filter(*base_filter)
    sev_rows = sev_q.group_by(WaterSample.severity).all()

    severity_distribution = [
        {
            "severity": row.severity or "Unknown",
            "count": row.count,
            "percentage": round(row.count / total * 100, 1) if total else 0,
        }
        for row in sev_rows
    ]

    # Top locations by chemical alert count
    # If filtered by state, show top districts within that state; otherwise top states nationally
    if resolved_state:
        dist_chem_q = db.query(
            WaterSample.district.label("loc_name"),
            func.count(WaterSample.id).label("chemical_count")
        ).filter(
            WaterSample.alert_category == AlertCategory.CRITICAL_CHEMICAL_TOXIN,
            *base_filter
        ).group_by(WaterSample.district).order_by(
            func.count(WaterSample.id).desc()
        ).limit(10)
        top_chem_rows = dist_chem_q.all()
    else:
        state_chem_q = db.query(
            WaterSample.state_ut.label("loc_name"),
            func.count(WaterSample.id).label("chemical_count")
        ).filter(
            WaterSample.alert_category == AlertCategory.CRITICAL_CHEMICAL_TOXIN
        ).group_by(WaterSample.state_ut).order_by(
            func.count(WaterSample.id).desc()
        ).limit(10)
        top_chem_rows = state_chem_q.all()

    top_chemical_states = [
        {"state_ut": row.loc_name or "Unknown", "chemical_alerts": row.chemical_count}
        for row in top_chem_rows
    ]

    # Real severity breakdown per location (districts if state selected; states if national)
    loc_col = WaterSample.district if resolved_state else WaterSample.state_ut
    sev_loc_q = db.query(
        loc_col.label("loc"),
        func.count(WaterSample.id).label("total"),
        func.sum(case((WaterSample.severity == Severity.LOW, 1), else_=0)).label("low"),
        func.sum(case((WaterSample.severity == Severity.MODERATE, 1), else_=0)).label("moderate"),
        func.sum(case((WaterSample.severity == Severity.HIGH, 1), else_=0)).label("high"),
        func.sum(case((WaterSample.severity == Severity.CRITICAL, 1), else_=0)).label("critical")
    ).filter(*base_filter).group_by(loc_col).order_by(func.count(WaterSample.id).desc()).limit(8)

    severity_by_location = [
        {
            "loc": r.loc or "Unknown",
            "total": r.total or 0,
            "low": r.low or 0,
            "moderate": r.moderate or 0,
            "high": r.high or 0,
            "critical": r.critical or 0,
        }
        for r in sev_loc_q.all()
    ]

    # Real monthly trends from actual sample dates
    month_expr = func.substr(WaterSample.sample_date, 1, 7)
    trend_q = db.query(
        month_expr.label("month_str"),
        func.count(WaterSample.id).label("total"),
        func.sum(case((WaterSample.alert_category == AlertCategory.POTABLE_SAFE, 1), else_=0)).label("safe"),
        func.sum(case((WaterSample.alert_category == AlertCategory.CRITICAL_CHEMICAL_TOXIN, 1), else_=0)).label("chemical"),
        func.sum(case((WaterSample.alert_category == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN, 1), else_=0)).label("biological"),
        func.sum(case((WaterSample.alert_category == AlertCategory.MODERATE_PHYSICAL_PARAM, 1), else_=0)).label("physical")
    ).filter(
        WaterSample.sample_date != None,
        *base_filter
    ).group_by(month_expr).order_by(month_expr)

    MONTH_NAMES = {
        "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
        "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
        "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
    }
    monthly_trends = []
    for r in trend_q.all():
        parts = (r.month_str or "").split("-")
        month_label = MONTH_NAMES.get(parts[1], parts[1]) if len(parts) >= 2 else (r.month_str or "Unknown")
        monthly_trends.append({
            "month": month_label,
            "raw_month": r.month_str,
            "safe": r.safe or 0,
            "chemical": r.chemical or 0,
            "biological": r.biological or 0,
            "physical": r.physical or 0,
            "total": r.total or 0,
        })

    # Real Parameter compliance based on IS 10500 standards
    param_configs = [
        ("pH Level", WaterSample.ph,
         (WaterSample.ph >= 6.5) & (WaterSample.ph <= 8.5),
         ((WaterSample.ph >= 6.0) & (WaterSample.ph < 6.5)) | ((WaterSample.ph > 8.5) & (WaterSample.ph <= 9.0)),
         (WaterSample.ph < 6.0) | (WaterSample.ph > 9.0)),
        ("Turbidity", WaterSample.turbidity_ntu,
         WaterSample.turbidity_ntu <= 1.0,
         (WaterSample.turbidity_ntu > 1.0) & (WaterSample.turbidity_ntu <= 5.0),
         WaterSample.turbidity_ntu > 5.0),
        ("Fluoride", WaterSample.fluoride_mg_l,
         WaterSample.fluoride_mg_l <= 1.0,
         (WaterSample.fluoride_mg_l > 1.0) & (WaterSample.fluoride_mg_l <= 1.5),
         WaterSample.fluoride_mg_l > 1.5),
        ("Arsenic", WaterSample.arsenic_mg_l,
         WaterSample.arsenic_mg_l <= 0.01,
         (WaterSample.arsenic_mg_l > 0.01) & (WaterSample.arsenic_mg_l <= 0.05),
         WaterSample.arsenic_mg_l > 0.05),
        ("Nitrate", WaterSample.nitrate_mg_l,
         WaterSample.nitrate_mg_l <= 45.0,
         (WaterSample.nitrate_mg_l > 45.0) & (WaterSample.nitrate_mg_l <= 50.0),
         WaterSample.nitrate_mg_l > 50.0),
        ("E. Coli", WaterSample.e_coli_mpn,
         WaterSample.e_coli_mpn == 0.0,
         (WaterSample.e_coli_mpn > 0.0) & (WaterSample.e_coli_mpn <= 10.0),
         WaterSample.e_coli_mpn > 10.0),
    ]

    parameter_health = []
    for pname, col, safe_cond, warn_cond, dang_cond in param_configs:
        p_res = db.query(
            func.count(WaterSample.id).filter(col != None, *base_filter),
            func.sum(case((safe_cond, 1), else_=0)).filter(col != None, *base_filter),
            func.sum(case((warn_cond, 1), else_=0)).filter(col != None, *base_filter),
            func.sum(case((dang_cond, 1), else_=0)).filter(col != None, *base_filter),
        ).first()
        p_total = p_res[0] or 0
        parameter_health.append({
            "name": pname,
            "safe": p_res[1] or 0,
            "warning": p_res[2] or 0,
            "danger": p_res[3] or 0,
            "total": p_total,
        })

    return {
        "total_samples": total,
        "safe_samples": safe,
        "unsafe_samples": total - safe,
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
        "severity_by_location": severity_by_location,
        "monthly_trends": monthly_trends,
        "parameter_health": parameter_health,
        "missing_location_count": missing_loc_count,
        "filter_state": resolved_state,
        "filter_district": clean_district,
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
