"""Advisory request/response schemas."""
from typing import List, Optional
from pydantic import BaseModel


class AdvisoryRequest(BaseModel):
    """Request to generate multi-language advisory via Gemini."""
    # Location context
    state: str
    district: str
    village: Optional[str] = None
    water_source_type: Optional[str] = None

    # Pre-computed verdict fields (from rule engine — never from frontend logic)
    parameter: str
    measured_value: Optional[float] = None
    unit: str = ""
    rule_category: str
    severity: str
    action_code: str       # Must match ActionCode constants
    do_not_boil: bool      # The invariant flag from rule engine
    reason: str = ""

    # New structured communication fields (from rule engine — never from AI)
    safe_to_drink: bool = False
    recommended_actions: List[str] = []
    avoid_actions: List[str] = []
    message_type: str = "SAFE"
    
    # Target language configuration
    target_language: str = "English"
    language_code: str = "en"

    # Optional: sample ID for traceability
    sample_id: Optional[int] = None


class AdvisoryResponse(BaseModel):
    warning_title: str
    warning: str
    caution: str
    solution: str
    short_message: str
    source: str            # "gemini" or "fallback:reason"
    model_used: Optional[str] = None
    do_not_boil: bool      # Echo back the immutable flag for frontend enforcement
    safe_to_drink: bool = False  # Echo back for frontend enforcement
    message_type: str = "SAFE"  # Echo back for frontend template selection
    target_language: str = "English"
    language_code: str = "en"
