"""
JalRakshak — Gemini Vernacular Advisory Service
================================================

ARCHITECTURE CONTRACT
---------------------
Gemini is a LANGUAGE GENERATION layer ONLY.
Gemini NEVER:
  - decides if water is safe or unsafe
  - overrides the rule engine verdict
  - changes action_code, do_not_boil, safe_to_drink
  - generates recommended_actions or avoid_actions
  - invents laboratory measurements
  - invents safety warnings not present in the verdict

Gemini receives ONLY pre-computed facts and produces localized text in the target language.

FALLBACK BEHAVIOUR
------------------
If Gemini is unavailable (missing key, rate limit, network error),
the service returns a deterministic fallback advisory in the requested language
(or English if unavailable) based on message_type. The application
remains fully functional without Gemini.

VALIDATION LAYER
----------------
After receiving Gemini's response, the service validates that:
  1. If safe_to_drink=False, advisory must not claim water is safe.
  2. If do_not_boil=True (chemical hazard), advisory must NOT recommend
     plain boiling as a solution without negation context.
If validation fails, the deterministic fallback is used.
"""
from __future__ import annotations

import json
import logging
from typing import List, Optional

from app.config import get_settings
from app.rules.standards import ActionCode
from app.rules.water_quality_rules import MessageType
from app.ai.fallbacks import get_fallback_advisory

logger = logging.getLogger(__name__)
settings = get_settings()


# ── Response contract ──────────────────────────────────────────────────────────

class AdvisoryResponse:
    def __init__(
        self,
        warning_title: str,
        warning: str,
        caution: str,
        solution: str,
        short_message: str,
        source: str = "gemini",  # "gemini" or "fallback:reason"
        model_used: Optional[str] = None,
        do_not_boil: bool = False,
        safe_to_drink: bool = False,
        message_type: str = MessageType.SAFE,
        target_language: str = "English",
        language_code: str = "en",
    ):
        self.warning_title = warning_title
        self.warning = warning
        self.caution = caution
        self.solution = solution
        self.short_message = short_message
        self.source = source
        self.model_used = model_used
        self.do_not_boil = do_not_boil
        self.safe_to_drink = safe_to_drink
        self.message_type = message_type
        self.target_language = target_language
        self.language_code = language_code

    def to_dict(self) -> dict:
        return {
            "warning_title": self.warning_title,
            "warning":       self.warning,
            "caution":       self.caution,
            "solution":      self.solution,
            "short_message": self.short_message,
            "source":        self.source,
            "model_used":    self.model_used,
            "do_not_boil":   self.do_not_boil,
            "safe_to_drink": self.safe_to_drink,
            "message_type":  self.message_type,
            "target_language": self.target_language,
            "language_code": self.language_code,
        }


# ── Prompt builder ─────────────────────────────────────────────────────────────

def _build_prompt(context: dict) -> str:
    """
    Build a Gemini prompt that:
    1. Tells Gemini it is a LANGUAGE TRANSLATOR only
    2. Provides the pre-computed safety verdict
    3. Explicitly instructs it NEVER to change the safety classification
    4. Requests structured JSON output in the target language.
    """
    state              = context.get("state", "Unknown")
    district           = context.get("district", "Unknown")
    parameter          = context.get("parameter", "")
    measured_value     = context.get("measured_value", "")
    unit               = context.get("unit", "")
    rule_category      = context.get("rule_category", "")
    severity           = context.get("severity", "")
    action_code        = context.get("action_code", "")
    do_not_boil        = context.get("do_not_boil", False)
    safe_to_drink      = context.get("safe_to_drink", False)
    message_type       = context.get("message_type", MessageType.SAFE)
    recommended_actions = context.get("recommended_actions", [])
    avoid_actions      = context.get("avoid_actions", [])
    reason             = context.get("reason", "")
    target_language    = context.get("target_language", "English")
    language_code      = context.get("language_code", "en")

    # Build generic English action strings to pass to the translator
    action_map = {
        "BOIL_OR_CHLORINATE":                    "Boil water or do chlorination",
        "DISINFECT_BEFORE_DRINKING":             "Use proper disinfection before drinking",
        "USE_ALTERNATIVE_SAFE_SOURCE":           "Use an alternative safe water source",
        "USE_APPROPRIATE_CHEMICAL_TREATMENT":    "Use appropriate chemical treatment system",
        "DISINFECT_FOR_BIOLOGICAL_CONTAMINATION":"Disinfect for biological contamination",
        "FILTER_OR_TREAT":                       "Use appropriate filtration/treatment",
        "RETEST":                                "Retest water after treatment",
    }
    avoid_map = {
        "DO_NOT_RELY_ON_BOILING": "Do NOT rely on boiling — boiling does not remove chemical contaminants and can concentrate them",
    }

    rec_actions_text = "\n".join(
        f"  - {action_map.get(a, a)}"
        for a in recommended_actions
    ) or "  - No specific action needed (water is safe)"

    avoid_text = "\n".join(
        f"  - {avoid_map.get(a, a)}"
        for a in avoid_actions
    ) or "  - (No restrictions)"

    safe_status = "Yes — currently safe to drink" if safe_to_drink else "No — NOT safe to drink currently"

    return f"""You are a multilingual expert helping rural Indian citizens understand water quality results.
You are translating and adapting this message into: {target_language}.

CRITICAL RULES — FOLLOW STRICTLY:
1. You are ONLY a language translator and communicator. You do NOT make safety decisions.
2. The safety verdict has ALREADY been calculated by the deterministic rule engine. You MUST NOT change it.
3. safe_to_drink={safe_to_drink} is FIXED. You cannot change it.
4. do_not_boil={do_not_boil} is FIXED. You cannot change it.
5. recommended_actions are FIXED. Translate them accurately. Do NOT add or remove actions.
6. avoid_actions are FIXED. Translate them accurately. Do NOT add or remove restrictions.
7. Do NOT invent medical advice, new treatment instructions, or restrictions not present above.
8. Do NOT say the water is safe if safe_to_drink=False.
9. Do NOT say the water is unsafe if safe_to_drink=True.
10. If do_not_boil=True, caution MUST mention that boiling is not appropriate for this chemical issue.
11. Use simple {target_language} that normal citizens can understand easily.
12. Avoid technical jargon. Be direct and actionable.
13. Do NOT translate, convert, or invent numbers/measurements. Keep '{measured_value} {unit}' exactly as is.
14. Ensure proper cultural phrasing in {target_language}.

PRE-COMPUTED SAFETY VERDICT (from deterministic rule engine — DO NOT CHANGE):
- Location: {district}, {state}
- Water problem type: {message_type}
- Classified as: {rule_category}
- Severity: {severity}
- Is the water safe to drink now: {safe_status}
- Do NOT rely on boiling: {do_not_boil}
- Primary detected issue: {parameter} = {measured_value} {unit}
- Rule reason: {reason}

PRE-COMPUTED RECOMMENDED ACTIONS (translate these — do NOT add more):
{rec_actions_text}

PRE-COMPUTED THINGS TO AVOID (translate these — do NOT add more):
{avoid_text}

Generate a JSON advisory. The JSON must have exactly these keys:
{{
  "warning_title": "One-line title in {target_language} (with appropriate emoji for {message_type})",
  "warning": "2-3 sentences explaining the water problem in simple {target_language}",
  "caution": "Critical safety instruction in {target_language} (must respect do_not_boil={do_not_boil} and safe_to_drink={safe_to_drink})",
  "solution": "What the citizen should do — translate recommended_actions into {target_language}, be specific and actionable",
  "short_message": "One short sentence summary in {target_language} (for WhatsApp/SMS)",
  "target_language": "{target_language}",
  "language_code": "{language_code}"
}}

Respond with ONLY valid JSON. No markdown, no code blocks, no extra text."""


# ── Validation layer ───────────────────────────────────────────────────────────

_BOILING_POSITIVE_KEYWORDS_EN = ["boil", "boiling", "boil water", "boil the water"]
_BOILING_NEGATIVE_KEYWORDS_EN = ["do not boil", "don't boil", "do not rely on boiling", "boiling does not"]

_SAFE_POSITIVE_KEYWORDS_EN = ["is safe", "safe to drink", "drinkable", "you can drink"]
_SAFE_NEGATIVE_KEYWORDS_EN = ["not safe", "unsafe", "cannot drink", "do not drink"]

_BOILING_POSITIVE_KEYWORDS_HI = ["उबाल", "उबालकर", "उबालें", "गर्म करें", "गर्म कर"]
_BOILING_NEGATIVE_KEYWORDS_HI = ["उबालकर न पिएँ", "उबालकर नहीं", "मत उबालें", "उबालने से", "उबालने पर निर्भर न", "बिल्कुल न पिएँ", "उबालना उचित नहीं"]

_SAFE_POSITIVE_KEYWORDS_HI = ["सुरक्षित है", "पी सकते", "पीने योग्य है"]
_SAFE_NEGATIVE_KEYWORDS_HI = ["सुरक्षित नहीं है", "पीने योग्य नहीं है", "न पिएँ", "खतरनाक है"]


def _validate_advisory(
    advisory: dict,
    do_not_boil: bool,
    safe_to_drink: bool,
    language_code: str,
) -> bool:
    """
    Validate that the Gemini advisory does not contradict the deterministic verdict.
    Returns True if valid, False if the advisory must be rejected.
    Uses English and Hindi keyword checks as a baseline safety net.
    """
    full_text = " ".join([
        str(advisory.get("caution", "")),
        str(advisory.get("solution", "")),
        str(advisory.get("short_message", "")),
        str(advisory.get("warning", "")),
    ]).lower()

    # We only apply basic keyword checks for 'en' and 'hi' to avoid false positives in other languages.
    # The AI structural constraints and prompt enforce safety for all languages.
    if language_code in ["en", "hi"]:
        if language_code == "en":
            pos_boil = _BOILING_POSITIVE_KEYWORDS_EN
            neg_boil = _BOILING_NEGATIVE_KEYWORDS_EN
            pos_safe = _SAFE_POSITIVE_KEYWORDS_EN
            neg_safe = _SAFE_NEGATIVE_KEYWORDS_EN
        else:
            pos_boil = _BOILING_POSITIVE_KEYWORDS_HI
            neg_boil = _BOILING_NEGATIVE_KEYWORDS_HI
            pos_safe = _SAFE_POSITIVE_KEYWORDS_HI
            neg_safe = _SAFE_NEGATIVE_KEYWORDS_HI

        # ── Check 1: If do_not_boil, ensure boiling is NOT recommended ────────────
        if do_not_boil:
            for kw in pos_boil:
                if kw in full_text:
                    has_negation = any(neg in full_text for neg in neg_boil)
                    if not has_negation:
                        logger.warning(
                            f"ADVISORY VALIDATION FAILED [{language_code}]: Gemini recommended boiling "
                            "when do_not_boil=True. Rejecting response."
                        )
                        return False

        # ── Check 2: If water is NOT safe, advisory must not claim it is safe ─────
        if not safe_to_drink:
            for kw in pos_safe:
                if kw in full_text:
                    has_negation = any(neg in full_text for neg in neg_safe)
                    if not has_negation:
                        logger.warning(
                            f"ADVISORY VALIDATION FAILED [{language_code}]: Gemini claimed water is safe "
                            "when safe_to_drink=False. Rejecting response."
                        )
                        return False

    return True


# ── Main service function ──────────────────────────────────────────────────────

async def generate_advisory(context: dict) -> AdvisoryResponse:
    """
    Generate a multilingual advisory for a water quality result.

    SAFETY CONTRACT:
    - This function receives a pre-computed verdict from the rule engine.
    - It passes only facts to Gemini, never asking "is this safe?".
    - If Gemini's response contradicts do_not_boil or safe_to_drink, it is rejected.
    - If Gemini is unavailable, a deterministic fallback is used.
    """
    action_code     = context.get("action_code", ActionCode.SAFE_TO_DRINK)
    do_not_boil     = bool(context.get("do_not_boil", False))
    safe_to_drink   = bool(context.get("safe_to_drink", False))
    message_type    = context.get("message_type", MessageType.SAFE)
    target_language = context.get("target_language", "English")
    language_code   = context.get("language_code", "en")

    if not settings.gemini_available:
        logger.info("Gemini API key not configured — using deterministic fallback advisory.")
        return _get_fallback(
            message_type=message_type,
            reason="no_api_key",
            do_not_boil=do_not_boil,
            safe_to_drink=safe_to_drink,
            target_language=target_language,
            language_code=language_code,
        )

    try:
        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = _build_prompt(context)

        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )

        raw_text = response.text.strip()

        # Remove markdown code fences if present
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(
                line for line in lines
                if not line.startswith("```") and not line.startswith("json")
            ).strip()

        advisory_dict = json.loads(raw_text)

        # ── CRITICAL: Validate advisory against deterministic verdict ─────────
        if not _validate_advisory(advisory_dict, do_not_boil, safe_to_drink, language_code):
            logger.warning("Gemini advisory failed safety validation. Using fallback.")
            return _get_fallback(
                message_type=message_type,
                reason="safety_validation_failed",
                do_not_boil=do_not_boil,
                safe_to_drink=safe_to_drink,
                target_language=target_language,
                language_code=language_code,
            )

        return AdvisoryResponse(
            warning_title=advisory_dict.get("warning_title", ""),
            warning=advisory_dict.get("warning", ""),
            caution=advisory_dict.get("caution", ""),
            solution=advisory_dict.get("solution", ""),
            short_message=advisory_dict.get("short_message", ""),
            source="gemini",
            model_used=settings.gemini_model,
            do_not_boil=do_not_boil,
            safe_to_drink=safe_to_drink,
            message_type=message_type,
            target_language=advisory_dict.get("target_language", target_language),
            language_code=advisory_dict.get("language_code", language_code),
        )

    except json.JSONDecodeError as e:
        logger.warning(f"Gemini returned non-JSON response: {e}. Using fallback.")
        return _get_fallback(
            message_type=message_type,
            reason="json_parse_error",
            do_not_boil=do_not_boil,
            safe_to_drink=safe_to_drink,
            target_language=target_language,
            language_code=language_code,
        )

    except Exception as e:
        logger.warning(f"Gemini request failed: {type(e).__name__}: {e}. Using fallback.")
        return _get_fallback(
            message_type=message_type,
            reason=f"error_{type(e).__name__}",
            do_not_boil=do_not_boil,
            safe_to_drink=safe_to_drink,
            target_language=target_language,
            language_code=language_code,
        )


def _get_fallback(
    message_type: str,
    reason: str,
    do_not_boil: bool = False,
    safe_to_drink: bool = False,
    target_language: str = "English",
    language_code: str = "en",
) -> AdvisoryResponse:
    """Return deterministic advisory based on message_type and language_code."""
    data = get_fallback_advisory(message_type, language_code)
    
    return AdvisoryResponse(
        warning_title=data.get("warning_title", ""),
        warning=data.get("warning", ""),
        caution=data.get("caution", ""),
        solution=data.get("solution", ""),
        short_message=data.get("short_message", ""),
        source=f"fallback:{reason}",
        model_used=None,
        do_not_boil=do_not_boil,
        safe_to_drink=safe_to_drink,
        message_type=message_type,
        target_language=target_language,
        language_code=language_code,
    )
