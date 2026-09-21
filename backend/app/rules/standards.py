"""
JalRakshak — Water Quality Standards Configuration
===================================================

The deterministic rule engine is the sole authority for:
    - safety classification
    - alert category
    - action code
    - do_not_boil

Gemini is only used for vernacular communication.

Reference/acceptable limits are kept separate from the
JalRakshak classification thresholds derived from the
validated 50,000-row project dataset.
"""

from dataclasses import dataclass
from typing import Optional


# =============================================================================
# PARAMETER STANDARD
# =============================================================================

@dataclass(frozen=True)
class ParameterStandard:
    name: str
    unit: str

    acceptable_limit: Optional[float]
    permissible_limit: Optional[float]

    no_relaxation: bool = False

    is_chemical_hazard: bool = False
    is_biological_hazard: bool = False
    is_physical_param: bool = False

    lower_limit: Optional[float] = None
    upper_limit: Optional[float] = None

    # Actual JalRakshak classification threshold
    classification_limit: Optional[float] = None

    interpretation: str = ""
    recommended_action: str = ""

    reference: str = "BIS IS 10500:2012"

    classification_basis: str = (
        "JalRakshak validated dataset classification rule"
    )

    severity_above_acceptable: str = "MODERATE"
    severity_above_permissible: str = "CRITICAL"


# =============================================================================
# WATER STANDARDS
# =============================================================================

WATER_STANDARDS: dict[str, ParameterStandard] = {

    # =========================================================================
    # PHYSICAL PARAMETERS
    # =========================================================================

    "ph": ParameterStandard(
        name="pH",
        unit="pH units",

        acceptable_limit=None,
        permissible_limit=None,

        no_relaxation=True,
        is_physical_param=True,

        lower_limit=6.5,
        upper_limit=8.5,

        classification_limit=None,

        interpretation=(
            "pH outside the configured 6.5–8.5 range indicates "
            "acidic or alkaline water requiring investigation."
        ),

        recommended_action=(
            "Investigate the source, apply appropriate treatment, "
            "and retest the water."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "JalRakshak classification: pH < 6.5 or pH > 8.5"
        ),
    ),

    "turbidity_ntu": ParameterStandard(
        name="Turbidity",
        unit="NTU",

        acceptable_limit=1.0,
        permissible_limit=5.0,

        is_physical_param=True,

        classification_limit=5.0,

        interpretation=(
            "Turbidity represents suspended particles in water. "
            "The JalRakshak classification rule flags values above "
            "5 NTU for treatment."
        ),

        recommended_action=(
            "Use approved sedimentation/filtration treatment "
            "and retest the water."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "Validated 50K dataset rule: turbidity > 5 NTU"
        ),
    ),

    "tds_mg_l": ParameterStandard(
        name="Total Dissolved Solids (TDS)",
        unit="mg/L",

        acceptable_limit=500.0,
        permissible_limit=2000.0,

        is_physical_param=True,

        classification_limit=2000.0,

        interpretation=(
            "High TDS indicates elevated dissolved matter. "
            "JalRakshak classifies values above 2000 mg/L "
            "as a physical concern requiring treatment."
        ),

        recommended_action=(
            "Use an appropriate treatment system such as RO "
            "where technically suitable, or use a certified "
            "safe alternative source."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "Validated 50K dataset rule: TDS > 2000 mg/L"
        ),
    ),

    "total_hardness_mg_l": ParameterStandard(
        name="Total Hardness",
        unit="mg/L as CaCO₃",

        acceptable_limit=200.0,
        permissible_limit=600.0,

        is_physical_param=True,

        classification_limit=600.0,

        interpretation=(
            "Total hardness measures dissolved calcium and "
            "magnesium salts. The JalRakshak 50K dataset "
            "classification flags values above 600 mg/L."
        ),

        recommended_action=(
            "Investigate the source, consider suitable treatment, "
            "and retest."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "Validated 50K dataset rule: total hardness > 600 mg/L"
        ),
    ),

    # =========================================================================
    # CHEMICAL PARAMETERS
    # =========================================================================

    "fluoride_mg_l": ParameterStandard(
        name="Fluoride",
        unit="mg/L",

        acceptable_limit=1.0,
        permissible_limit=1.5,

        is_chemical_hazard=True,

        classification_limit=1.5,

        interpretation=(
            "Fluoride is a chemical contaminant of public-health "
            "importance. The JalRakshak classification rule flags "
            "values above 1.5 mg/L."
        ),

        recommended_action=(
            "DO NOT BOIL. Use an appropriate fluoride-removal "
            "treatment system or a certified safe alternative source."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "Validated 50K dataset rule: fluoride > 1.5 mg/L"
        ),

        severity_above_acceptable="HIGH",
        severity_above_permissible="CRITICAL",
    ),

    "arsenic_mg_l": ParameterStandard(
        name="Arsenic",
        unit="mg/L",

        acceptable_limit=0.01,
        permissible_limit=0.05,

        is_chemical_hazard=True,

        classification_limit=0.01,

        interpretation=(
            "Arsenic is a toxic chemical contaminant. "
            "The JalRakshak classification rule flags arsenic "
            "above 10 µg/L (0.01 mg/L)."
        ),

        recommended_action=(
            "DO NOT BOIL. Use an approved arsenic-removal "
            "treatment system or a certified safe alternative "
            "water source."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "Validated 50K dataset rule: arsenic > 10 µg/L "
            "(equivalent to > 0.01 mg/L)"
        ),

        severity_above_acceptable="CRITICAL",
        severity_above_permissible="CRITICAL",
    ),

    "nitrate_mg_l": ParameterStandard(
        name="Nitrate",
        unit="mg/L as NO₃",

        acceptable_limit=45.0,
        permissible_limit=45.0,

        no_relaxation=True,
        is_chemical_hazard=True,

        classification_limit=45.0,

        interpretation=(
            "Nitrate above the configured threshold is treated "
            "as a chemical hazard by JalRakshak."
        ),

        recommended_action=(
            "DO NOT BOIL. Use a suitable nitrate-removal "
            "treatment system or a certified safe alternative source."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "Validated 50K dataset rule: nitrate > 45 mg/L"
        ),

        severity_above_acceptable="CRITICAL",
        severity_above_permissible="CRITICAL",
    ),

    "iron_mg_l": ParameterStandard(
        name="Iron",
        unit="mg/L",

        acceptable_limit=0.3,
        permissible_limit=1.0,

        is_chemical_hazard=True,

        classification_limit=1.0,

        interpretation=(
            "Iron is monitored as part of the JalRakshak chemical "
            "water-quality profile. The validated 50K dataset "
            "classifies values above 1.0 mg/L as chemical hazard."
        ),

        recommended_action=(
            "Use an appropriate iron-removal treatment system "
            "or a certified safe alternative source and retest."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "Validated 50K dataset rule: iron > 1.0 mg/L"
        ),

        severity_above_acceptable="HIGH",
        severity_above_permissible="CRITICAL",
    ),

    "uranium_ug_l": ParameterStandard(
        name="Uranium",
        unit="µg/L",

        acceptable_limit=None,
        permissible_limit=None,

        is_chemical_hazard=True,

        classification_limit=30.0,

        interpretation=(
            "Uranium is monitored in the JalRakshak water-quality "
            "profile. The validated project dataset uses 30 µg/L "
            "as its classification trigger."
        ),

        recommended_action=(
            "DO NOT BOIL. Use an approved treatment system or "
            "a certified safe alternative water source."
        ),

        reference=(
            "Project classification profile; regulatory basis "
            "must be documented separately from BIS IS 10500:2012."
        ),

        classification_basis=(
            "Validated 50K dataset rule: uranium > 30 µg/L"
        ),

        severity_above_acceptable="CRITICAL",
        severity_above_permissible="CRITICAL",
    ),

    # =========================================================================
    # MICROBIOLOGICAL PARAMETERS
    # =========================================================================

    "e_coli_mpn": ParameterStandard(
        name="E. coli / Thermotolerant Coliform Indicator",
        unit="MPN/100 mL",

        acceptable_limit=0.0,
        permissible_limit=0.0,

        no_relaxation=True,
        is_biological_hazard=True,

        classification_limit=0.0,

        interpretation=(
            "A detectable microbiological indicator indicates "
            "biological contamination requiring treatment."
        ),

        recommended_action=(
            "Where applicable, boil water to a rolling boil before "
            "drinking or use an appropriate disinfection method. "
            "Investigate the contamination source and retest."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "Validated 50K dataset rule: fecal/thermotolerant "
            "coliform indicator > 0"
        ),

        severity_above_acceptable="CRITICAL",
        severity_above_permissible="CRITICAL",
    ),

    "total_coliform_mpn": ParameterStandard(
        name="Total Coliform",
        unit="MPN/100 mL",

        acceptable_limit=0.0,
        permissible_limit=0.0,

        no_relaxation=True,
        is_biological_hazard=True,

        classification_limit=0.0,

        interpretation=(
            "Detectable total coliform is treated as a biological "
            "warning in the operational rule framework."
        ),

        recommended_action=(
            "Use appropriate boiling/disinfection where applicable, "
            "investigate the contamination pathway, and retest."
        ),

        reference="BIS IS 10500:2012",

        classification_basis=(
            "Operational biological rule: total coliform > 0"
        ),

        severity_above_acceptable="HIGH",
        severity_above_permissible="CRITICAL",
    ),
}


# =============================================================================
# ACTION CODES
# =============================================================================

class ActionCode:
    """
    Deterministic action codes.

    NEVER generated or modified by AI.
    """

    SAFE_TO_DRINK = "SAFE_TO_DRINK"

    BOIL_OR_CHLORINATE_REQUIRED = (
        "BOIL_OR_CHLORINATE_REQUIRED"
    )

    DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY = (
        "DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY"
    )

    # Exact action code used by the validated 50K dataset
    # for physical-parameter alerts.
    FILTRATION_TREATMENT_RECOMMENDED = (
        "FILTRATION_TREATMENT_RECOMMENDED"
    )

    # Legacy/internal action retained for compatibility.
    FILTER_AND_RETEST = (
        "FILTER_AND_RETEST"
    )

    # Compatibility alias for older tests/code.
    # The actual validated dataset action for mixed hazards is:
    # DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY
    MIXED_HAZARD_CHEMICAL_PRIORITY = (
        DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY
    )


# =============================================================================
# ALERT CATEGORIES
# =============================================================================

class AlertCategory:

    POTABLE_SAFE = "POTABLE_SAFE"

    UNSAFE_BIOLOGICAL_PATHOGEN = (
        "UNSAFE_BIOLOGICAL_PATHOGEN"
    )

    CRITICAL_CHEMICAL_TOXIN = (
        "CRITICAL_CHEMICAL_TOXIN"
    )

    MODERATE_PHYSICAL_PARAM = (
        "MODERATE_PHYSICAL_PARAM"
    )

    CRITICAL_MIXED_HAZARD = (
        "CRITICAL_MIXED_HAZARD"
    )


# =============================================================================
# SEVERITY LEVELS
# =============================================================================

class Severity:

    SAFE = "SAFE"
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# =============================================================================
# HELPER LOOKUPS
# =============================================================================

CHEMICAL_HAZARD_PARAMS = [
    key
    for key, value in WATER_STANDARDS.items()
    if value.is_chemical_hazard
]


BIOLOGICAL_HAZARD_PARAMS = [
    key
    for key, value in WATER_STANDARDS.items()
    if value.is_biological_hazard
]


PHYSICAL_PARAMS = [
    key
    for key, value in WATER_STANDARDS.items()
    if value.is_physical_param
]


# =============================================================================
# UI LABELS
# =============================================================================

ACTION_CODE_LABELS = {

    ActionCode.SAFE_TO_DRINK:
        "✅ Safe to Drink",

    ActionCode.BOIL_OR_CHLORINATE_REQUIRED:
        "🔥 Boil / Chlorinate Required",

    ActionCode.DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY:
        "🚫 DO NOT BOIL — Use Alternative Source",

    ActionCode.FILTRATION_TREATMENT_RECOMMENDED:
        "🔄 Filtration / Treatment Recommended",

    ActionCode.FILTER_AND_RETEST:
        "🔄 Filter and Retest",
}


CATEGORY_LABELS = {

    AlertCategory.POTABLE_SAFE:
        "Potable — Safe",

    AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN:
        "Unsafe — Biological Pathogen",

    AlertCategory.CRITICAL_CHEMICAL_TOXIN:
        "Critical — Chemical Toxin",

    AlertCategory.MODERATE_PHYSICAL_PARAM:
        "Moderate — Physical Parameter",

    AlertCategory.CRITICAL_MIXED_HAZARD:
        "Critical — Mixed Hazard",
}