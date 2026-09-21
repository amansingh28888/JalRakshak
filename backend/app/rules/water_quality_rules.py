"""
JalRakshak — Deterministic Water Quality Rule Engine
=====================================================

ARCHITECTURE INVARIANT
----------------------
This module is the SOLE safety authority in JalRakshak.

    RAW MEASUREMENTS
           ↓
     evaluate_sample()
           ↓
     WaterQualityVerdict
           ↓
     Gemini receives the verdict ONLY
           ↓
     Gemini explains in Hindi/Hinglish

Gemini may explain the verdict in vernacular language,
but MUST NEVER change the safety classification.

ANTI-BOILING GUARANTEE
----------------------
Any chemical hazard detected by the deterministic
classification rules forces:

    do_not_boil = True

This applies to:
    - Fluoride
    - Arsenic
    - Nitrate
    - Iron
    - Uranium
    - Mixed chemical + biological hazards

The value cannot be overridden by downstream AI.

IMPORTANT
---------
Official/reference limits and JalRakshak's validated
dataset classification thresholds are kept separate
inside standards.py.

This engine uses the project's explicit
classification_limit for classification.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.rules.standards import (
    WATER_STANDARDS,
    ActionCode,
    AlertCategory,
    Severity,
)


# =============================================================================
# MESSAGE TYPES
# =============================================================================

class MessageType:
    """
    Structured message type identifiers for the safety communication layer.

    Used by the frontend and Gemini to determine the correct communication
    template. Generated exclusively by the deterministic rule engine.
    Gemini must NEVER produce or override these values.
    """
    SAFE                     = "SAFE"
    BIOLOGICAL_CONTAMINATION = "BIOLOGICAL_CONTAMINATION"
    CHEMICAL_CONTAMINATION   = "CHEMICAL_CONTAMINATION"
    PHYSICAL_PARAMETER       = "PHYSICAL_PARAMETER"
    MIXED_HAZARD             = "MIXED_HAZARD"


# =============================================================================
# OUTPUT DATA STRUCTURES
# =============================================================================


@dataclass
class ParameterResult:
    """
    Evaluation result for one water-quality parameter.
    """

    name: str
    field_name: str

    measured_value: Optional[float]

    unit: str

    acceptable_limit: Optional[float]
    permissible_limit: Optional[float]

    status: str
    # Possible values:
    #   OK
    #   ACCEPTABLE_EXCEEDED
    #   PERMISSIBLE_EXCEEDED
    #   NO_DATA

    exceedance_ratio: Optional[float] = None

    interpretation: str = ""

    is_chemical_hazard: bool = False
    is_biological_hazard: bool = False


@dataclass
class WaterQualityVerdict:
    """
    Fully deterministic water-quality verdict.

    This object is created exclusively by evaluate_sample().
    Gemini must never modify any field.

    EXISTING FIELDS (preserved for backward compatibility):
        category, severity, action_code, do_not_boil,
        primary_contaminant, reasons, recommended_action,
        parameter_results, summary

    NEW STRUCTURED COMMUNICATION FIELDS (all deterministic):
        safe_to_drink       — True only for POTABLE_SAFE
        recommended_actions — structured action string list
        avoid_actions       — structured avoid string list
        message_type        — high-level communication template key

    Python dataclass ordering note:
        Fields with defaults MUST come after fields without defaults.
        The new fields have defaults to remain backward-compatible.
    """

    # ── Required fields (no defaults) ────────────────────────────────────────
    category: str
    severity: str
    action_code: str

    # Critical anti-boiling invariant — chemical hazard → True
    do_not_boil: bool

    primary_contaminant: Optional[str]

    reasons: List[str]

    recommended_action: str

    parameter_results: List[ParameterResult]

    # ── Optional / new fields (with defaults for backward compat) ─────────────

    summary: str = ""

    # True only when category == POTABLE_SAFE
    safe_to_drink: bool = False

    # Structured action codes for the frontend and Gemini.
    # Defined by the deterministic engine — never by AI.
    # Examples:
    #   BOIL_OR_CHLORINATE
    #   USE_ALTERNATIVE_SAFE_SOURCE
    #   USE_APPROPRIATE_CHEMICAL_TREATMENT
    #   DISINFECT_BEFORE_DRINKING
    #   DISINFECT_FOR_BIOLOGICAL_CONTAMINATION
    #   FILTER_OR_TREAT
    #   RETEST
    recommended_actions: List[str] = field(default_factory=list)

    # Actions to avoid — only populated when a deterministic rule
    # explicitly requires it. Never invented by AI.
    # Example:
    #   DO_NOT_RELY_ON_BOILING  (for chemical and mixed hazards)
    avoid_actions: List[str] = field(default_factory=list)

    # High-level message template key.
    # Values defined in MessageType class.
    message_type: str = MessageType.SAFE

    def to_dict(self) -> Dict[str, Any]:
        """Convert verdict into a JSON-serializable dictionary."""

        return {
            # ── Existing fields (backward-compatible) ──────────────────────
            "category":            self.category,
            "severity":            self.severity,
            "action_code":         self.action_code,
            "do_not_boil":         self.do_not_boil,
            "primary_contaminant": self.primary_contaminant,
            "reasons":             self.reasons,
            "recommended_action":  self.recommended_action,
            "summary":             self.summary,
            # ── New structured communication fields ────────────────────────
            "safe_to_drink":       self.safe_to_drink,
            "recommended_actions": self.recommended_actions,
            "avoid_actions":       self.avoid_actions,
            "message_type":        self.message_type,
            # ── Parameter detail ───────────────────────────────────────────
            "parameter_results": [
                {
                    "name":               p.name,
                    "field_name":         p.field_name,
                    "measured_value":     p.measured_value,
                    "unit":               p.unit,
                    "acceptable_limit":   p.acceptable_limit,
                    "permissible_limit":  p.permissible_limit,
                    "status":             p.status,
                    "exceedance_ratio":   p.exceedance_ratio,
                    "interpretation":     p.interpretation,
                    "is_chemical_hazard": p.is_chemical_hazard,
                    "is_biological_hazard": p.is_biological_hazard,
                }
                for p in self.parameter_results
            ],
        }


# =============================================================================
# INTERNAL HELPERS
# =============================================================================


def _val(
    sample: dict,
    key: str,
) -> Optional[float]:
    """
    Safely extract a non-negative numeric value.
    """

    value = sample.get(key)

    if value is None:
        return None

    try:
        number = float(value)

        if number < 0:
            return None

        return number

    except (TypeError, ValueError):
        return None


def _evaluate_parameter(
    field_name: str,
    sample: dict,
) -> ParameterResult:
    """
    Evaluate one parameter using the project's configured
    classification threshold.

    Important distinction:

        acceptable_limit
        permissible_limit

    are retained for reference/display.

    The actual JalRakshak classification uses:

        classification_limit

    when one is defined.
    """

    std = WATER_STANDARDS[field_name]

    value = _val(
        sample,
        field_name,
    )

    # -------------------------------------------------------------------------
    # No data
    # -------------------------------------------------------------------------

    if value is None:

        return ParameterResult(
            name=std.name,
            field_name=field_name,
            measured_value=None,
            unit=std.unit,
            acceptable_limit=std.acceptable_limit,
            permissible_limit=std.permissible_limit,
            status="NO_DATA",
            exceedance_ratio=None,
            interpretation=std.interpretation,
            is_chemical_hazard=std.is_chemical_hazard,
            is_biological_hazard=std.is_biological_hazard,
        )

    # -------------------------------------------------------------------------
    # pH is a range-based parameter
    # -------------------------------------------------------------------------

    if field_name == "ph":

        lower = std.lower_limit
        upper = std.upper_limit

        if lower is None or upper is None:

            return ParameterResult(
                name=std.name,
                field_name=field_name,
                measured_value=value,
                unit=std.unit,
                acceptable_limit=None,
                permissible_limit=None,
                status="OK",
                exceedance_ratio=None,
                interpretation=std.interpretation,
                is_chemical_hazard=std.is_chemical_hazard,
                is_biological_hazard=std.is_biological_hazard,
            )

        if lower <= value <= upper:

            status = "OK"
            exceedance = None

        else:

            status = "PERMISSIBLE_EXCEEDED"

            if value < lower:
                exceedance = lower - value
            else:
                exceedance = value - upper

        return ParameterResult(
            name=std.name,
            field_name=field_name,
            measured_value=value,
            unit=std.unit,
            acceptable_limit=lower,
            permissible_limit=upper,
            status=status,
            exceedance_ratio=exceedance,
            interpretation=std.interpretation,
            is_chemical_hazard=std.is_chemical_hazard,
            is_biological_hazard=std.is_biological_hazard,
        )

    # -------------------------------------------------------------------------
    # Project classification threshold
    # -------------------------------------------------------------------------

    classification_limit = std.classification_limit

    if classification_limit is not None:

        # Zero-limit parameters:
        #
        # fecal/thermotolerant coliform > 0
        #
        if classification_limit == 0.0:

            if value > 0:

                status = "PERMISSIBLE_EXCEEDED"
                exceedance = value

            else:

                status = "OK"
                exceedance = None

        else:

            if value <= classification_limit:

                status = "OK"
                exceedance = None

            else:

                status = "PERMISSIBLE_EXCEEDED"
                exceedance = value / classification_limit

        return ParameterResult(
            name=std.name,
            field_name=field_name,
            measured_value=value,
            unit=std.unit,
            acceptable_limit=std.acceptable_limit,
            permissible_limit=std.permissible_limit,
            status=status,
            exceedance_ratio=exceedance,
            interpretation=std.interpretation,
            is_chemical_hazard=std.is_chemical_hazard,
            is_biological_hazard=std.is_biological_hazard,
        )

    # -------------------------------------------------------------------------
    # Fallback comparison
    #
    # Used only for parameters that do not define a separate
    # JalRakshak classification_limit.
    # -------------------------------------------------------------------------

    acceptable = std.acceptable_limit
    permissible = std.permissible_limit

    if acceptable == 0.0 and permissible == 0.0:

        if value > 0:

            status = "PERMISSIBLE_EXCEEDED"
            exceedance = value

        else:

            status = "OK"
            exceedance = None

    elif acceptable is not None and value <= acceptable:

        status = "OK"
        exceedance = None

    elif permissible is not None and value <= permissible:

        status = "ACCEPTABLE_EXCEEDED"

        exceedance = (
            value / permissible
            if permissible
            else None
        )

    else:

        status = "PERMISSIBLE_EXCEEDED"

        exceedance = (
            value / permissible
            if permissible
            else None
        )

    return ParameterResult(
        name=std.name,
        field_name=field_name,
        measured_value=value,
        unit=std.unit,
        acceptable_limit=acceptable,
        permissible_limit=permissible,
        status=status,
        exceedance_ratio=exceedance,
        interpretation=std.interpretation,
        is_chemical_hazard=std.is_chemical_hazard,
        is_biological_hazard=std.is_biological_hazard,
    )


# =============================================================================
# MAIN RULE ENGINE
# =============================================================================


def evaluate_sample(
    sample: dict,
) -> WaterQualityVerdict:
    """
    Deterministically classify one water-quality sample.

    Expected canonical fields include:

        ph
        turbidity_ntu
        tds_mg_l
        total_hardness_mg_l

        fluoride_mg_l
        arsenic_mg_l
        nitrate_mg_l
        iron_mg_l
        uranium_ug_l

        e_coli_mpn
        total_coliform_mpn

    Classification order:

        1. Chemical + biological → MIXED
        2. Chemical only          → CHEMICAL
        3. Biological only        → BIOLOGICAL
        4. Physical only          → PHYSICAL
        5. No hazard              → SAFE

    ANTI-BOILING INVARIANT:

        chemical hazard
            ⇒ do_not_boil=True

    This value is generated here and must never be
    overwritten by Gemini.
    """

    # =========================================================================
    # STEP 1 — Evaluate every configured parameter
    # =========================================================================

    all_params = list(
        WATER_STANDARDS.keys()
    )

    parameter_results = [
        _evaluate_parameter(
            field_name,
            sample,
        )
        for field_name in all_params
    ]

    # =========================================================================
    # STEP 2 — Group violations by type
    # =========================================================================

    chemical_violations: List[ParameterResult] = []

    biological_violations: List[ParameterResult] = []

    physical_violations: List[ParameterResult] = []

    for result in parameter_results:

        if result.status not in {
            "PERMISSIBLE_EXCEEDED",
            "ACCEPTABLE_EXCEEDED",
        }:
            continue

        if result.is_chemical_hazard:

            chemical_violations.append(
                result
            )

        elif result.is_biological_hazard:

            biological_violations.append(
                result
            )

        else:

            physical_violations.append(
                result
            )

    # =========================================================================
    # STEP 3 — CLASSIFICATION
    # =========================================================================

    # -------------------------------------------------------------------------
    # MIXED HAZARD
    # -------------------------------------------------------------------------

    if chemical_violations and biological_violations:

        primary = _most_severe_chemical(
            chemical_violations
        )

        reasons = (
            _build_chemical_reasons(
                chemical_violations
            )
            +
            _build_bio_reasons(
                biological_violations
            )
        )

        return WaterQualityVerdict(

            category=AlertCategory.CRITICAL_MIXED_HAZARD,

            severity=Severity.CRITICAL,

            # IMPORTANT:
            # The validated 50K dataset uses the same
            # do-not-boil alternative-source action for
            # mixed chemical + biological records.
            action_code=(
                ActionCode.DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY
            ),

            # ANTI-BOILING INVARIANT
            do_not_boil=True,

            primary_contaminant=primary,

            reasons=reasons,

            recommended_action=(
                "CRITICAL MIXED HAZARD: chemical and "
                "biological contamination detected. "
                "Chemical hazard takes priority. "
                "Use a certified safe alternative source or "
                "an appropriate chemical treatment method. "
                "Biological disinfection should also be "
                "addressed according to the applicable "
                "water-safety procedure."
            ),

            parameter_results=parameter_results,

            summary=(
                f"Mixed chemical and biological contamination. "
                f"Primary chemical hazard: {primary}. "
                f"Chemical safety takes priority."
            ),

            # ── New structured communication fields ────────────────────────
            safe_to_drink=False,
            recommended_actions=[
                "USE_ALTERNATIVE_SAFE_SOURCE",
                "USE_APPROPRIATE_CHEMICAL_TREATMENT",
                "DISINFECT_FOR_BIOLOGICAL_CONTAMINATION",
            ],
            avoid_actions=[
                "DO_NOT_RELY_ON_BOILING",
            ],
            message_type=MessageType.MIXED_HAZARD,
        )

    # -------------------------------------------------------------------------
    # CHEMICAL HAZARD
    # -------------------------------------------------------------------------

    if chemical_violations:

        primary = _most_severe_chemical(
            chemical_violations
        )

        reasons = _build_chemical_reasons(
            chemical_violations
        )

        return WaterQualityVerdict(

            category=AlertCategory.CRITICAL_CHEMICAL_TOXIN,

            severity=Severity.CRITICAL,

            action_code=(
                ActionCode.DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY
            ),

            # ANTI-BOILING INVARIANT
            do_not_boil=True,

            primary_contaminant=primary,

            reasons=reasons,

            recommended_action=(
                "Chemical contamination detected. "
                "Use an appropriate chemical treatment method "
                "or a certified safe alternative water source. "
                "Boiling does not remove chemical contaminants "
                "and may concentrate them."
            ),

            parameter_results=parameter_results,

            summary=(
                f"Critical chemical contamination: {primary}. "
                f"Use appropriate treatment or an alternative safe source."
            ),

            # ── New structured communication fields ────────────────────────
            safe_to_drink=False,
            recommended_actions=[
                "USE_ALTERNATIVE_SAFE_SOURCE",
                "USE_APPROPRIATE_CHEMICAL_TREATMENT",
            ],
            avoid_actions=[
                "DO_NOT_RELY_ON_BOILING",
            ],
            message_type=MessageType.CHEMICAL_CONTAMINATION,
        )

    # -------------------------------------------------------------------------
    # BIOLOGICAL HAZARD
    # -------------------------------------------------------------------------

    if biological_violations:

        primary = _most_severe_biological(
            biological_violations
        )

        reasons = _build_bio_reasons(
            biological_violations
        )

        return WaterQualityVerdict(

            category=AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN,

            severity=Severity.CRITICAL,

            action_code=(
                ActionCode.BOIL_OR_CHLORINATE_REQUIRED
            ),

            do_not_boil=False,

            primary_contaminant=primary,

            reasons=reasons,

            recommended_action=(
                "Biological contamination detected. "
                "Treat the water using an appropriate "
                "disinfection method such as boiling or "
                "chlorination. Investigate the contamination "
                "source. Retest after treatment."
            ),

            parameter_results=parameter_results,

            summary=(
                f"Biological contamination detected: {primary}. "
                f"Appropriate disinfection and retesting are required."
            ),

            # ── New structured communication fields ────────────────────────
            safe_to_drink=False,
            recommended_actions=[
                "BOIL_OR_CHLORINATE",
                "DISINFECT_BEFORE_DRINKING",
            ],
            avoid_actions=[],
            message_type=MessageType.BIOLOGICAL_CONTAMINATION,
        )

    # -------------------------------------------------------------------------
    # PHYSICAL PARAMETER
    # -------------------------------------------------------------------------

    if physical_violations:

        # Select the first configured physical violation.
        primary = (
            physical_violations[0].name
        )

        reasons = [
            (
                f"{result.name}: "
                f"{result.measured_value} "
                f"{result.unit} "
                f"(classification threshold: "
                f"{WATER_STANDARDS[result.field_name].classification_limit})"
            )
            for result in physical_violations
        ]

        return WaterQualityVerdict(

            category=AlertCategory.MODERATE_PHYSICAL_PARAM,

            severity=Severity.MODERATE,

            # IMPORTANT:
            # The validated 50K dataset uses this action
            # for physical-parameter alerts.
            action_code=(
                ActionCode.FILTRATION_TREATMENT_RECOMMENDED
            ),

            do_not_boil=False,

            primary_contaminant=primary,

            reasons=reasons,

            recommended_action=(
                "A physical parameter exceeds the configured "
                "classification threshold. Apply appropriate "
                "physical treatment such as filtration where "
                "suitable, investigate the source, and retest "
                "the water."
            ),

            parameter_results=parameter_results,

            summary=(
                f"Physical parameter concern: {primary}. "
                f"Treatment and retesting recommended."
            ),

            # ── New structured communication fields ────────────────────────
            safe_to_drink=False,
            recommended_actions=[
                "FILTER_OR_TREAT",
                "RETEST",
            ],
            avoid_actions=[],
            message_type=MessageType.PHYSICAL_PARAMETER,
        )

    # =========================================================================
    # SAFE
    # =========================================================================

    return WaterQualityVerdict(

        category=AlertCategory.POTABLE_SAFE,

        severity=Severity.SAFE,

        action_code=ActionCode.SAFE_TO_DRINK,

        do_not_boil=False,

        primary_contaminant=None,

        reasons=[
            "No configured JalRakshak classification threshold "
            "was exceeded."
        ],

        recommended_action=(
            "No configured classification trigger was detected. "
            "Continue routine water-quality monitoring."
        ),

        parameter_results=parameter_results,

        summary=(
            "No configured JalRakshak classification threshold "
            "was exceeded."
        ),

        # ── New structured communication fields ────────────────────────────
        safe_to_drink=True,
        recommended_actions=[],
        avoid_actions=[],
        message_type=MessageType.SAFE,
    )


# =============================================================================
# PRIMARY CONTAMINANT HELPERS
# =============================================================================


def _most_severe_chemical(
    violations: List[ParameterResult],
) -> str:
    """
    Select the primary chemical contaminant.

    Priority is deterministic and exists only for
    display/message purposes. It does not change
    the safety classification.
    """

    priority_order = [
        "arsenic_mg_l",
        "arsenic_ug_l",
        "fluoride_mg_l",
        "nitrate_mg_l",
        "uranium_ug_l",
        "uranium_mg_l",
        "iron_mg_l",
    ]

    for field_name in priority_order:

        for result in violations:

            if result.field_name == field_name:
                return result.name

    return (
        violations[0].name
        if violations
        else "Unknown"
    )


def _most_severe_biological(
    violations: List[ParameterResult],
) -> str:
    """
    Select the primary biological indicator.
    """

    for result in violations:

        if result.field_name == "e_coli_mpn":
            return result.name

    for result in violations:

        if result.field_name == "total_coliform_mpn":
            return result.name

    return (
        violations[0].name
        if violations
        else "Unknown"
    )


# =============================================================================
# REASON BUILDERS
# =============================================================================


def _build_chemical_reasons(
    violations: List[ParameterResult],
) -> List[str]:

    reasons: List[str] = []

    for result in violations:

        if result.measured_value is None:
            continue

        standard = WATER_STANDARDS[
            result.field_name
        ]

        threshold = (
            standard.classification_limit
        )

        reasons.append(
            f"{result.name}: "
            f"{result.measured_value:.3f} {result.unit} "
            f"[JalRakshak classification threshold: "
            f"{threshold} {result.unit}] "
            f"— chemical hazard detected."
        )

    return reasons


def _build_bio_reasons(
    violations: List[ParameterResult],
) -> List[str]:

    reasons: List[str] = []

    for result in violations:

        if result.measured_value is None:
            continue

        standard = WATER_STANDARDS[
            result.field_name
        ]

        threshold = (
            standard.classification_limit
        )

        reasons.append(
            f"{result.name}: "
            f"{result.measured_value:.1f} {result.unit} "
            f"[JalRakshak classification threshold: "
            f"{threshold} {result.unit}] "
            f"— biological hazard detected."
        )

    return reasons