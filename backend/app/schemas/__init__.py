# schemas package
from app.schemas.sample import (
    SampleEvaluateRequest, WaterSampleResponse, PaginatedSamplesResponse,
    WaterQualityVerdictSchema, ParameterResultSchema,
    DashboardSummary, CategoryCount, StateStats
)
from app.schemas.advisory import AdvisoryRequest, AdvisoryResponse

__all__ = [
    "SampleEvaluateRequest", "WaterSampleResponse", "PaginatedSamplesResponse",
    "WaterQualityVerdictSchema", "ParameterResultSchema",
    "DashboardSummary", "CategoryCount", "StateStats",
    "AdvisoryRequest", "AdvisoryResponse",
]
