"""
JalRakshak — Worker API Router

Handles protected field worker operations such as creating water samples.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.database import get_db
from app.models.water_sample import WaterSample
from app.models.user_profile import UserProfile
from app.models.audit_log import AuditLog
from app.api.deps.auth import require_field_worker
from app.schemas.sample import WaterSampleResponse, PaginatedSamplesResponse, SampleEvaluateRequest
from app.rules.water_quality_rules import evaluate_sample

router = APIRouter(prefix="/api/worker", tags=["worker"])

@router.post("/samples", response_model=WaterSampleResponse)
def create_sample(
    body: SampleEvaluateRequest,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_field_worker),
):
    """
    Worker creates a new water sample.
    Body is validated by SampleEvaluateRequest Pydantic schema.
    The safety fields are evaluated deterministically by the rule engine.
    """

    sample_data = body.model_dump()

    # 1. Enforce location assignment
    req_state = sample_data.get("state_ut")
    req_district = sample_data.get("district")
    req_village = sample_data.get("village")

    if current_user.state_ut and req_state and current_user.state_ut.lower() != req_state.lower():
        raise HTTPException(status_code=403, detail="Not assigned to this state")

    if current_user.district and req_district and current_user.district.lower() != req_district.lower():
        raise HTTPException(status_code=403, detail="Not assigned to this district")

    # 2. Evaluate safety via deterministic rule engine
    verdict = evaluate_sample(sample_data)

    # 3. Persist sample
    new_sample = WaterSample(
        sample_id=f"W-{uuid.uuid4().hex[:8]}",
        state_ut=req_state,
        district=req_district,
        village=req_village,
        water_source_type=sample_data.get("water_source_type"),
        season_cycle=sample_data.get("season_cycle"),
        sample_date=sample_data.get("sample_date") or datetime.now().strftime("%Y-%m-%d"),
        latitude=sample_data.get("latitude"),
        longitude=sample_data.get("longitude"),
        location_type=sample_data.get("location_type"),

        ph=sample_data.get("ph"),
        turbidity_ntu=sample_data.get("turbidity_ntu"),
        tds_mg_l=sample_data.get("tds_mg_l"),
        total_hardness_mg_l=sample_data.get("total_hardness_mg_l"),
        chloride_mg_l=sample_data.get("chloride_mg_l"),
        fluoride_mg_l=sample_data.get("fluoride_mg_l"),
        arsenic_mg_l=sample_data.get("arsenic_mg_l"),
        arsenic_ug_l=sample_data.get("arsenic_ug_l"),
        nitrate_mg_l=sample_data.get("nitrate_mg_l"),
        iron_mg_l=sample_data.get("iron_mg_l"),
        uranium_ug_l=sample_data.get("uranium_ug_l"),
        uranium_mg_l=sample_data.get("uranium_mg_l"),
        e_coli_mpn=sample_data.get("e_coli_mpn"),
        total_coliform_mpn=sample_data.get("total_coliform_mpn"),

        # Rule Engine results
        alert_category=verdict.category,
        severity=verdict.severity,
        action_code=verdict.action_code,
        do_not_boil=verdict.do_not_boil,
        primary_contaminant=verdict.primary_contaminant,
        rule_reason="; ".join(verdict.reasons[:3]),

        # Identity tracking
        import_batch=f"worker_{current_user.id}",
    )

    db.add(new_sample)
    db.commit()
    db.refresh(new_sample)

    # 4. Audit Log
    audit = AuditLog(
        auth_user_id=current_user.auth_user_id,
        user_id=current_user.id,
        action="SAMPLE_CREATED",
        entity_type="WaterSample",
        entity_id=str(new_sample.id),
    )
    db.add(audit)
    db.commit()

    return new_sample

@router.get("/samples", response_model=PaginatedSamplesResponse)
def get_my_samples(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_field_worker),
):
    """
    Get samples submitted by this worker.
    """
    q = db.query(WaterSample).filter(WaterSample.import_batch == f"worker_{current_user.id}")
    
    total = q.count()
    pages = max(1, (total + page_size - 1) // page_size)
    items = q.order_by(WaterSample.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedSamplesResponse(
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
        items=items
    )
