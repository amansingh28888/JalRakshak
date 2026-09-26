"""
JalRakshak — Pydantic Schemas for Water Samples
All API request/response models with validation.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Input schema for manual sample evaluation ─────────────────────────────────

class SampleEvaluateRequest(BaseModel):
    """Schema for POST /api/evaluate — manual sample submission."""

    state_ut: str = Field(..., min_length=1, max_length=128)
    district: str = Field(..., min_length=1, max_length=128)
    village: Optional[str] = Field(None, max_length=256)
    water_source_type: Optional[str] = Field(None, max_length=64)
    season_cycle: Optional[str] = None
    sample_date: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    # ── Water quality parameters ──────────────────────────────────────────────

    ph: Optional[float] = Field(None, ge=0, le=14)
    turbidity_ntu: Optional[float] = Field(None, ge=0)
    tds_mg_l: Optional[float] = Field(None, ge=0)

    total_hardness_mg_l: Optional[float] = Field(None, ge=0)
    chloride_mg_l: Optional[float] = Field(None, ge=0)

    fluoride_mg_l: Optional[float] = Field(None, ge=0)

    arsenic_mg_l: Optional[float] = Field(None, ge=0)
    arsenic_ug_l: Optional[float] = Field(None, ge=0)

    nitrate_mg_l: Optional[float] = Field(None, ge=0)

    iron_mg_l: Optional[float] = Field(None, ge=0)
    uranium_ug_l: Optional[float] = Field(None, ge=0)

    e_coli_mpn: Optional[float] = Field(None, ge=0)
    total_coliform_mpn: Optional[float] = Field(None, ge=0)


# ── Parameter result detail ───────────────────────────────────────────────────

class ParameterResultSchema(BaseModel):
    name: str
    field_name: str
    measured_value: Optional[float]
    unit: str
    acceptable_limit: Optional[float]
    permissible_limit: Optional[float]
    status: str
    exceedance_ratio: Optional[float]
    interpretation: str
    is_chemical_hazard: bool
    is_biological_hazard: bool


# ── Verdict response ──────────────────────────────────────────────────────────

class WaterQualityVerdictSchema(BaseModel):
    # ── Existing fields (backward-compatible) ─────────────────────────────────
    category: str
    severity: str
    action_code: str
    do_not_boil: bool
    primary_contaminant: Optional[str]
    reasons: List[str]
    recommended_action: str
    summary: str
    parameter_results: List[ParameterResultSchema]
    # ── New structured communication fields ───────────────────────────────────
    safe_to_drink: bool = False
    recommended_actions: List[str] = []
    avoid_actions: List[str] = []
    message_type: str = "SAFE"


# ── Full sample response ──────────────────────────────────────────────────────

class WaterSampleResponse(BaseModel):
    id: int
    sample_id: Optional[str]

    state_ut: str
    district: str
    village: Optional[str]

    water_source_type: Optional[str]
    season_cycle: Optional[str]
    sample_date: Optional[str]

    latitude: Optional[float]
    longitude: Optional[float]
    location_type: Optional[str]

    # ── Core measurements ─────────────────────────────────────────────────────

    ph: Optional[float]
    turbidity_ntu: Optional[float]
    tds_mg_l: Optional[float]

    # ── Additional physical/chemical measurements ─────────────────────────────

    total_hardness_mg_l: Optional[float]
    chloride_mg_l: Optional[float]

    fluoride_mg_l: Optional[float]

    arsenic_mg_l: Optional[float]
    arsenic_ug_l: Optional[float]

    nitrate_mg_l: Optional[float]

    iron_mg_l: Optional[float]
    uranium_ug_l: Optional[float]

    # ── Biological measurements ───────────────────────────────────────────────

    e_coli_mpn: Optional[float]
    total_coliform_mpn: Optional[float]

    # ── Stored deterministic verdict ──────────────────────────────────────────

    alert_category: Optional[str]
    severity: Optional[str]
    action_code: Optional[str]
    do_not_boil: bool

    primary_contaminant: Optional[str]
    rule_reason: Optional[str]

    created_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# ── Paginated list response ───────────────────────────────────────────────────

class PaginatedSamplesResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[WaterSampleResponse]


# ── Dashboard schemas ──────────────────────────────────────────────────────────

class CategoryCount(BaseModel):
    category: str
    count: int
    percentage: float


class StateStats(BaseModel):
    state_ut: str
    total: int
    safe: int
    chemical: int
    biological: int
    physical: int
    mixed: int
    do_not_boil: int


class DashboardSummary(BaseModel):
    total_samples: int
    safe_samples: int
    biological_alerts: int
    chemical_alerts: int
    physical_concerns: int
    mixed_hazards: int
    do_not_boil_alerts: int

    safe_percentage: float
    do_not_boil_percentage: float

    total_states: int
    total_districts: int

    category_distribution: List[CategoryCount]
    source_distribution: List[Dict[str, Any]]
    top_chemical_states: List[StateStats]