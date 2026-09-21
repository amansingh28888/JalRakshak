"""Samples API — CRUD + filtering + pagination."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.water_sample import WaterSample
from app.schemas.sample import (
    WaterQualityVerdictSchema,
    WaterSampleResponse,
    PaginatedSamplesResponse,
)
from app.rules.water_quality_rules import evaluate_sample


router = APIRouter(prefix="/api/samples", tags=["samples"])


# ── List samples ───────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedSamplesResponse)
def list_samples(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    state: Optional[str] = None,
    district: Optional[str] = None,
    water_source: Optional[str] = None,
    season: Optional[str] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    action_code: Optional[str] = None,
    do_not_boil: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Return paginated water samples with optional filters."""

    q = db.query(WaterSample)

    if state:
        q = q.filter(
            WaterSample.state_ut.ilike(f"%{state}%")
        )

    if district:
        q = q.filter(
            WaterSample.district.ilike(f"%{district}%")
        )

    if water_source:
        q = q.filter(
            WaterSample.water_source_type.ilike(f"%{water_source}%")
        )

    if season:
        q = q.filter(
            WaterSample.season_cycle.ilike(f"%{season}%")
        )

    if category:
        q = q.filter(
            WaterSample.alert_category == category
        )

    if severity:
        q = q.filter(
            WaterSample.severity == severity
        )

    if action_code:
        q = q.filter(
            WaterSample.action_code == action_code
        )

    if do_not_boil is not None:
        q = q.filter(
            WaterSample.do_not_boil == do_not_boil
        )

    if search:
        q = q.filter(
            or_(
                WaterSample.sample_id.ilike(f"%{search}%"),
                WaterSample.state_ut.ilike(f"%{search}%"),
                WaterSample.district.ilike(f"%{search}%"),
                WaterSample.village.ilike(f"%{search}%"),
            )
        )

    total = q.count()

    pages = max(
        1,
        (total + page_size - 1) // page_size
    )

    items = (
        q.order_by(WaterSample.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedSamplesResponse(
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
        items=items,
    )


# ── Get single sample ──────────────────────────────────────────────────────────

@router.get(
    "/{sample_id}",
    response_model=WaterSampleResponse,
)
def get_sample(
    sample_id: int,
    db: Session = Depends(get_db),
):
    """Return a single stored water sample by numeric database ID."""

    sample = (
        db.query(WaterSample)
        .filter(WaterSample.id == sample_id)
        .first()
    )

    if not sample:
        raise HTTPException(
            status_code=404,
            detail="Sample not found",
        )

    return sample


# ── Get deterministic verdict ─────────────────────────────────────────────────

@router.get(
    "/{sample_id}/verdict",
    response_model=WaterQualityVerdictSchema,
)
def get_sample_verdict(
    sample_id: int,
    db: Session = Depends(get_db),
):
    """
    Re-run the deterministic JalRakshak rule engine
    on a stored sample and return the detailed verdict.

    Gemini is NOT used here.
    """

    sample = (
        db.query(WaterSample)
        .filter(WaterSample.id == sample_id)
        .first()
    )

    if not sample:
        raise HTTPException(
            status_code=404,
            detail="Sample not found",
        )

    # IMPORTANT:
    # Pass every available water-quality measurement into
    # the deterministic rule engine.
    sample_dict = {
        # Physical
        "ph": sample.ph,
        "turbidity_ntu": sample.turbidity_ntu,
        "tds_mg_l": sample.tds_mg_l,
        "total_hardness_mg_l": sample.total_hardness_mg_l,

        # Other chemical measurements
        "chloride_mg_l": sample.chloride_mg_l,
        "fluoride_mg_l": sample.fluoride_mg_l,

        # Arsenic: preserve both units where available
        "arsenic_mg_l": sample.arsenic_mg_l,
        "arsenic_ug_l": sample.arsenic_ug_l,

        "nitrate_mg_l": sample.nitrate_mg_l,

        "iron_mg_l": sample.iron_mg_l,

        # Uranium in µg/L is the canonical rule-engine field
        "uranium_ug_l": sample.uranium_ug_l,

        # Biological indicators
        "e_coli_mpn": sample.e_coli_mpn,
        "total_coliform_mpn": sample.total_coliform_mpn,
    }

    verdict = evaluate_sample(sample_dict)

    return verdict.to_dict()