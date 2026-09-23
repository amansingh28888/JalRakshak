"""Dashboard & analytics API."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from app.database import get_db
from app.models.water_sample import WaterSample
from app.models.user_profile import UserProfile
from app.analytics.aggregations import get_dashboard_summary, get_state_stats, get_district_stats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    """
    All dashboard KPIs computed from live database.
    No hard-coded statistics.
    """
    return get_dashboard_summary(db)


@router.get("/by-state")
def by_state(db: Session = Depends(get_db)):
    return get_state_stats(db)


@router.get("/by-district")
def by_district(
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return get_district_stats(db, state_ut=state)


@router.get("/states")
def list_states(db: Session = Depends(get_db)):
    """Return sorted list of all unique states in database."""
    rows = db.query(distinct(WaterSample.state_ut)).order_by(WaterSample.state_ut).all()
    return [r[0] for r in rows if r[0]]


@router.get("/districts")
def list_districts(
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Return sorted list of districts, optionally filtered by state."""
    q = db.query(distinct(WaterSample.district)).order_by(WaterSample.district)
    if state:
        q = q.filter(WaterSample.state_ut == state)
    rows = q.all()
    return [r[0] for r in rows if r[0]]


@router.get("/public-stats")
def public_stats(db: Session = Depends(get_db)):
    """
    Public (unauthenticated) landing-page statistics.
    Returns real counts from the live database — no hard-coded numbers.
    """
    summary = get_dashboard_summary(db)

    # Count active field workers from user profiles table
    active_workers = (
        db.query(UserProfile)
        .filter(UserProfile.role == "field_worker", UserProfile.status == "active")
        .count()
    )

    return {
        "total_samples":      summary["total_samples"],
        "total_states":       summary["total_states"],
        "total_districts":    summary["total_districts"],
        "safe_percentage":    summary["safe_percentage"],
        "biological_alerts":  summary["biological_alerts"],
        "chemical_alerts":    summary["chemical_alerts"],
        "do_not_boil_alerts": summary["do_not_boil_alerts"],
        "active_workers":     active_workers,
    }
