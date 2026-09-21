"""
AI Advisory API — Gemini vernacular advisory generation.
Gemini is called ONLY from the backend. API key is NEVER sent to frontend.
"""
import logging
from fastapi import APIRouter, HTTPException
from app.schemas.advisory import AdvisoryRequest, AdvisoryResponse as AdvisoryResponseSchema
from app.ai.gemini_service import generate_advisory
from app.rules.standards import ActionCode

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/advisory", response_model=AdvisoryResponseSchema)
async def get_advisory(request: AdvisoryRequest):
    """
    Generate Hindi vernacular advisory for a water quality verdict.

    SAFETY CONTRACT:
    - The rule engine verdict (action_code, do_not_boil, safe_to_drink,
      recommended_actions, avoid_actions, message_type) is passed IN from
      the calling code — set by the rule engine, NOT by this endpoint.
    - Gemini receives only pre-computed facts and generates Hindi text.
    - If Gemini fails, a deterministic fallback is returned.
    - The safety flags are echoed back unchanged in the response.
    """
    # Validate that action_code is a known value
    valid_codes = [
        ActionCode.SAFE_TO_DRINK,
        ActionCode.BOIL_OR_CHLORINATE_REQUIRED,
        ActionCode.DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY,
        ActionCode.FILTER_AND_RETEST,
        ActionCode.FILTRATION_TREATMENT_RECOMMENDED,
        ActionCode.MIXED_HAZARD_CHEMICAL_PRIORITY,
    ]
    if request.action_code not in valid_codes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action_code: {request.action_code}"
        )

    context = {
        "state":               request.state,
        "district":            request.district,
        "parameter":           request.parameter,
        "measured_value":      str(request.measured_value) if request.measured_value is not None else "Not measured",
        "unit":                request.unit,
        "rule_category":       request.rule_category,
        "severity":            request.severity,
        "action_code":         request.action_code,
        "do_not_boil":         request.do_not_boil,
        "safe_to_drink":       request.safe_to_drink,
        "recommended_actions": request.recommended_actions,
        "avoid_actions":       request.avoid_actions,
        "message_type":        request.message_type,
        "reason":              request.reason,
        "target_language":     request.target_language,
        "language_code":       request.language_code,
    }

    result = await generate_advisory(context)

    return AdvisoryResponseSchema(
        warning_title=result.warning_title,
        warning=result.warning,
        caution=result.caution,
        solution=result.solution,
        short_message=result.short_message,
        source=result.source,
        model_used=result.model_used,
        do_not_boil=request.do_not_boil,       # Echo back unchanged — invariant
        safe_to_drink=request.safe_to_drink,    # Echo back unchanged — invariant
        message_type=request.message_type,      # Echo back for frontend use
        target_language=result.target_language if hasattr(result, 'target_language') else request.target_language,
        language_code=result.language_code if hasattr(result, 'language_code') else request.language_code,
    )


@router.get("/status")
def gemini_status():
    """Check if Gemini is configured (without exposing the key)."""
    from app.config import get_settings
    settings = get_settings()
    return {
        "gemini_configured": settings.gemini_available,
        "model": settings.gemini_model if settings.gemini_available else None,
        "fallback_available": True,  # Always True — app works without Gemini
    }
