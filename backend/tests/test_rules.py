"""
JalRakshak — Rule Engine Tests
================================

Tests the deterministic water quality rule engine with:
  - Safe samples
  - Biological-only contamination
  - Chemical-only contamination
  - Mixed chemical + biological
  - Physical parameter concerns
  - Boundary values
  - ANTI-BOILING INVARIANT (most critical test)

Important rule-engine design:
  - Reference/acceptable limits are displayed for context.
  - JalRakshak classification_limit values determine safety classification.
  - AI output can NEVER override deterministic safety decisions.

ANTI-BOILING INVARIANT:
  IF a configured chemical contaminant crosses its JalRakshak
  classification trigger THEN do_not_boil MUST be True.

This invariant must hold regardless of any AI output.
"""

import json

import pytest

from app.rules.water_quality_rules import evaluate_sample
from app.rules.standards import ActionCode, AlertCategory, Severity


# ── Helper ─────────────────────────────────────────────────────────────────────


def safe_base() -> dict:
    """
    A completely safe baseline sample.

    All values are below the JalRakshak classification triggers.
    """
    return {
        "ph": 7.2,
        "turbidity_ntu": 0.5,
        "tds_mg_l": 280,
        "fluoride_mg_l": 0.6,
        "arsenic_mg_l": 0.003,
        "nitrate_mg_l": 18,
        "e_coli_mpn": 0,
        "total_coliform_mpn": 0,
    }


# ── ANTI-BOILING INVARIANT ────────────────────────────────────────────────────


class TestAntiBoilingInvariant:
    """
    CRITICAL:
    These tests verify the core safety guarantee of JalRakshak.

    A chemical hazard crossing its configured JalRakshak
    classification trigger MUST produce do_not_boil=True.
    """

    def test_fluoride_above_permissible_do_not_boil(self):
        """
        Fluoride 2.45 mg/L > 1.5 mg/L classification trigger.
        Chemical hazard must produce do_not_boil=True.
        """
        s = safe_base()
        s["fluoride_mg_l"] = 2.45

        verdict = evaluate_sample(s)

        assert verdict.do_not_boil is True, (
            f"INVARIANT VIOLATED: fluoride={s['fluoride_mg_l']} "
            f"should set do_not_boil=True but got "
            f"do_not_boil={verdict.do_not_boil}"
        )

        assert verdict.category == AlertCategory.CRITICAL_CHEMICAL_TOXIN

        assert verdict.action_code in (
            ActionCode.DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY,
            ActionCode.MIXED_HAZARD_CHEMICAL_PRIORITY,
        )

    def test_arsenic_above_permissible_do_not_boil(self):
        """
        Arsenic 0.08 mg/L = 80 µg/L, which exceeds the configured
        JalRakshak classification trigger.

        Chemical hazard must produce do_not_boil=True.
        """
        s = safe_base()
        s["arsenic_mg_l"] = 0.08

        verdict = evaluate_sample(s)

        assert verdict.do_not_boil is True, (
            f"INVARIANT VIOLATED: arsenic={s['arsenic_mg_l']} "
            f"should set do_not_boil=True"
        )

        assert verdict.category == AlertCategory.CRITICAL_CHEMICAL_TOXIN

    def test_nitrate_above_limit_do_not_boil(self):
        """
        Nitrate 55 mg/L > 45 mg/L classification trigger.
        """
        s = safe_base()
        s["nitrate_mg_l"] = 55.0

        verdict = evaluate_sample(s)

        assert verdict.do_not_boil is True, (
            f"INVARIANT VIOLATED: nitrate={s['nitrate_mg_l']} "
            f"should set do_not_boil=True"
        )

    def test_mixed_hazard_chemical_priority_do_not_boil(self):
        """
        Mixed chemical + biological contamination.

        Chemical hazard has priority for the anti-boiling decision.
        Biological treatment advice must not override do_not_boil=True.
        """
        s = safe_base()
        s["arsenic_mg_l"] = 0.08
        s["e_coli_mpn"] = 450

        verdict = evaluate_sample(s)

        assert verdict.do_not_boil is True, (
            "INVARIANT VIOLATED: Mixed chemical+biological sample "
            "must have do_not_boil=True"
        )

        assert verdict.category == AlertCategory.CRITICAL_MIXED_HAZARD

        assert (
            verdict.action_code
            == ActionCode.MIXED_HAZARD_CHEMICAL_PRIORITY
        )

    def test_fluoride_below_classification_threshold_is_safe(self):
        """
        Fluoride 1.2 mg/L is:
          - above the reference acceptable value of 1.0 mg/L
          - below the JalRakshak classification trigger of 1.5 mg/L

        Therefore it should NOT be classified as a chemical hazard.
        """
        s = safe_base()
        s["fluoride_mg_l"] = 1.2

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False


# ── Safe sample ────────────────────────────────────────────────────────────────


class TestSafeSample:
    def test_all_parameters_within_limits(self):
        verdict = evaluate_sample(safe_base())

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.severity == Severity.SAFE
        assert verdict.action_code == ActionCode.SAFE_TO_DRINK
        assert verdict.do_not_boil is False

    def test_empty_sample_is_safe(self):
        """
        Sample with no measurements defaults to safe
        because no configured violation is detected.
        """
        verdict = evaluate_sample({})

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False


# ── Biological contamination ──────────────────────────────────────────────────


class TestBiologicalContamination:
    def test_ecoli_detected(self):
        s = safe_base()
        s["e_coli_mpn"] = 320

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN
        assert verdict.action_code == ActionCode.BOIL_OR_CHLORINATE_REQUIRED

        # No chemical hazard is present, so boiling remains allowed.
        assert verdict.do_not_boil is False

    def test_total_coliform_detected(self):
        s = safe_base()
        s["total_coliform_mpn"] = 50

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN
        assert verdict.do_not_boil is False

    def test_zero_ecoli_is_safe(self):
        s = safe_base()
        s["e_coli_mpn"] = 0.0
        s["total_coliform_mpn"] = 0.0

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE


# ── Chemical contamination ────────────────────────────────────────────────────


class TestChemicalContamination:
    def test_high_fluoride(self):
        s = safe_base()
        s["fluoride_mg_l"] = 3.5

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.CRITICAL_CHEMICAL_TOXIN
        assert verdict.severity == Severity.CRITICAL
        assert verdict.do_not_boil is True
        assert verdict.primary_contaminant == "Fluoride"

    def test_arsenic_at_reference_permissible_limit(self):
        """
        Arsenic at 0.05 mg/L.

        This is above the JalRakshak classification trigger of
        0.01 mg/L, so it must be classified as chemical hazard.

        The test intentionally does NOT describe this as
        'acceptable_exceeded', because the current engine separates
        reference limits from classification triggers.
        """
        s = safe_base()
        s["arsenic_mg_l"] = 0.05

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.CRITICAL_CHEMICAL_TOXIN
        assert verdict.do_not_boil is True
        assert verdict.primary_contaminant == "Arsenic"

    def test_arsenic_above_reference_permissible(self):
        s = safe_base()
        s["arsenic_mg_l"] = 0.06

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.CRITICAL_CHEMICAL_TOXIN
        assert verdict.do_not_boil is True
        assert verdict.primary_contaminant == "Arsenic"

    def test_nitrate_at_limit(self):
        """
        Nitrate exactly at 45 mg/L.

        Trigger begins only when value is greater than 45.
        """
        s = safe_base()
        s["nitrate_mg_l"] = 45.0

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False


# ── Physical parameters ───────────────────────────────────────────────────────


class TestPhysicalParameters:
    def test_high_turbidity(self):
        """
        Turbidity > 5 NTU triggers the JalRakshak physical category.
        """
        s = safe_base()
        s["turbidity_ntu"] = 18.5

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.MODERATE_PHYSICAL_PARAM
        assert verdict.do_not_boil is False

    def test_tds_below_classification_threshold_is_safe(self):
        """
        TDS 1250 mg/L is below the JalRakshak classification
        trigger of 2000 mg/L.
        """
        s = safe_base()
        s["tds_mg_l"] = 1250

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False

    def test_tds_above_classification_threshold(self):
        """
        TDS 2000.1 mg/L > 2000 mg/L classification trigger.
        """
        s = safe_base()
        s["tds_mg_l"] = 2000.1

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.MODERATE_PHYSICAL_PARAM
        assert verdict.do_not_boil is False

    def test_ph_too_acidic(self):
        s = safe_base()
        s["ph"] = 5.2

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.MODERATE_PHYSICAL_PARAM
        assert verdict.do_not_boil is False

    def test_ph_too_alkaline(self):
        s = safe_base()
        s["ph"] = 9.5

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.MODERATE_PHYSICAL_PARAM
        assert verdict.do_not_boil is False

    def test_ph_within_range(self):
        """
        pH exactly at lower boundary.
        """
        s = safe_base()
        s["ph"] = 6.5

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False


# ── Boundary value tests ──────────────────────────────────────────────────────


class TestBoundaryValues:
    def test_fluoride_at_reference_acceptable_limit(self):
        """
        Fluoride exactly at 1.0 mg/L.

        It is also below the JalRakshak classification trigger of
        1.5 mg/L, so the sample remains safe.
        """
        s = safe_base()
        s["fluoride_mg_l"] = 1.0

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False

    def test_fluoride_just_above_reference_acceptable(self):
        """
        Fluoride 1.01 mg/L is just above the reference acceptable value,
        but below the JalRakshak classification trigger of 1.5 mg/L.

        Therefore this must NOT trigger the anti-boiling invariant.
        """
        s = safe_base()
        s["fluoride_mg_l"] = 1.01

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False

    def test_fluoride_just_above_classification_threshold(self):
        """
        Fluoride 1.51 mg/L crosses the JalRakshak classification trigger.
        """
        s = safe_base()
        s["fluoride_mg_l"] = 1.51

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.CRITICAL_CHEMICAL_TOXIN
        assert verdict.do_not_boil is True
        assert verdict.primary_contaminant == "Fluoride"

    def test_arsenic_just_below_classification_threshold(self):
        """
        Arsenic 0.009 mg/L is below the configured classification
        trigger of 0.01 mg/L.
        """
        s = safe_base()
        s["arsenic_mg_l"] = 0.009

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False

    def test_arsenic_at_classification_threshold(self):
        """
        Exact threshold boundary.

        Trigger starts only above 0.01 mg/L.
        """
        s = safe_base()
        s["arsenic_mg_l"] = 0.01

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False

    def test_arsenic_just_above_classification_threshold(self):
        """
        0.0101 mg/L > 0.01 mg/L classification trigger.
        """
        s = safe_base()
        s["arsenic_mg_l"] = 0.0101

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.CRITICAL_CHEMICAL_TOXIN
        assert verdict.do_not_boil is True

    def test_nitrate_just_above_limit(self):
        """
        Nitrate 45.1 mg/L > 45 mg/L trigger.
        """
        s = safe_base()
        s["nitrate_mg_l"] = 45.1

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.CRITICAL_CHEMICAL_TOXIN
        assert verdict.do_not_boil is True

    def test_tds_at_classification_threshold(self):
        """
        Exact TDS boundary of 2000 mg/L is not exceeded.
        """
        s = safe_base()
        s["tds_mg_l"] = 2000.0

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.do_not_boil is False


# ── Verdict structure ─────────────────────────────────────────────────────────


class TestVerdictStructure:
    def test_verdict_has_all_required_fields(self):
        verdict = evaluate_sample(safe_base())

        assert hasattr(verdict, "category")
        assert hasattr(verdict, "severity")
        assert hasattr(verdict, "action_code")
        assert hasattr(verdict, "do_not_boil")
        assert hasattr(verdict, "reasons")
        assert hasattr(verdict, "recommended_action")
        assert hasattr(verdict, "parameter_results")

        assert isinstance(verdict.reasons, list)
        assert isinstance(verdict.parameter_results, list)

    def test_to_dict_serializable(self):
        verdict = evaluate_sample(safe_base())

        d = verdict.to_dict()

        # Must be JSON-serializable for the FastAPI API.
        json.dumps(d)

    def test_chemical_verdict_includes_do_not_boil_in_reasons(self):
        s = safe_base()
        s["fluoride_mg_l"] = 2.5

        verdict = evaluate_sample(s)

        reasons_text = " ".join(verdict.reasons).lower()

        assert (
            "chemical" in reasons_text
            or "fluoride" in reasons_text
        )


# ── Additional deterministic-rule regression tests ────────────────────────────


class TestDeterministicRegression:
    """
    Extra regression tests protecting the architecture from future changes.

    These are especially useful because the rule engine is the authoritative
    safety layer and Gemini must never determine the final safety category.
    """

    def test_chemical_always_overrides_biological_boiling_advice(self):
        """
        Chemical + biological contamination must remain do_not_boil=True.
        """
        s = safe_base()
        s["fluoride_mg_l"] = 2.0
        s["e_coli_mpn"] = 1000

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.CRITICAL_MIXED_HAZARD
        assert verdict.do_not_boil is True
        assert (
            verdict.action_code
            == ActionCode.MIXED_HAZARD_CHEMICAL_PRIORITY
        )

    def test_biological_only_allows_boiling(self):
        """
        Biological contamination without chemical contamination
        should remain in the biological treatment pathway.
        """
        s = safe_base()
        s["e_coli_mpn"] = 100

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN
        assert verdict.action_code == ActionCode.BOIL_OR_CHLORINATE_REQUIRED
        assert verdict.do_not_boil is False

    def test_physical_only_does_not_trigger_do_not_boil(self):
        """
        A purely physical parameter issue must not trigger the
        anti-boiling safeguard.
        """
        s = safe_base()
        s["turbidity_ntu"] = 10.0

        verdict = evaluate_sample(s)

        assert verdict.category == AlertCategory.MODERATE_PHYSICAL_PARAM
        assert verdict.do_not_boil is False

    def test_safe_sample_has_safe_action(self):
        verdict = evaluate_sample(safe_base())

        assert verdict.category == AlertCategory.POTABLE_SAFE
        assert verdict.severity == Severity.SAFE
        assert verdict.action_code == ActionCode.SAFE_TO_DRINK
        assert verdict.do_not_boil is False


# ── NEW: Structured communication fields tests ────────────────────────────────


class TestStructuredCommunicationFields:
    """
    Tests for the new structured safety communication fields:
        safe_to_drink
        recommended_actions
        avoid_actions
        message_type

    These fields are computed exclusively by the deterministic rule engine
    and must never be changed by Gemini.
    """

    # ── SAFE ──────────────────────────────────────────────────────────────────

    def test_safe_has_safe_to_drink_true(self):
        verdict = evaluate_sample(safe_base())
        assert verdict.safe_to_drink is True

    def test_safe_has_empty_recommended_actions(self):
        """Safe water needs no recommended actions."""
        verdict = evaluate_sample(safe_base())
        assert verdict.recommended_actions == []

    def test_safe_has_empty_avoid_actions(self):
        """Safe water has no restrictions."""
        verdict = evaluate_sample(safe_base())
        assert verdict.avoid_actions == []

    def test_safe_message_type(self):
        verdict = evaluate_sample(safe_base())
        assert verdict.message_type == "SAFE"

    # ── BIOLOGICAL ────────────────────────────────────────────────────────────

    def test_biological_safe_to_drink_false(self):
        s = safe_base()
        s["e_coli_mpn"] = 320
        verdict = evaluate_sample(s)
        assert verdict.safe_to_drink is False

    def test_biological_recommended_actions_include_disinfection(self):
        """
        Biological contamination should recommend boiling/disinfection,
        NOT simply 'do not boil'.
        """
        s = safe_base()
        s["e_coli_mpn"] = 320
        verdict = evaluate_sample(s)
        rec = verdict.recommended_actions
        assert len(rec) > 0
        assert "BOIL_OR_CHLORINATE" in rec or "DISINFECT_BEFORE_DRINKING" in rec

    def test_biological_avoid_actions_empty(self):
        """
        Biological-only contamination must NOT produce a
        DO_NOT_RELY_ON_BOILING avoid action.
        """
        s = safe_base()
        s["e_coli_mpn"] = 100
        verdict = evaluate_sample(s)
        assert "DO_NOT_RELY_ON_BOILING" not in verdict.avoid_actions

    def test_biological_message_type(self):
        s = safe_base()
        s["e_coli_mpn"] = 100
        verdict = evaluate_sample(s)
        assert verdict.message_type == "BIOLOGICAL_CONTAMINATION"

    # ── CHEMICAL ─────────────────────────────────────────────────────────────

    def test_chemical_safe_to_drink_false(self):
        s = safe_base()
        s["fluoride_mg_l"] = 2.5
        verdict = evaluate_sample(s)
        assert verdict.safe_to_drink is False

    def test_chemical_recommended_actions_include_alternative_source(self):
        s = safe_base()
        s["fluoride_mg_l"] = 2.5
        verdict = evaluate_sample(s)
        assert "USE_ALTERNATIVE_SAFE_SOURCE" in verdict.recommended_actions

    def test_chemical_avoid_actions_include_do_not_rely_on_boiling(self):
        """
        Chemical hazard MUST produce DO_NOT_RELY_ON_BOILING in avoid_actions.
        Boiling concentrates chemical contaminants.
        """
        s = safe_base()
        s["fluoride_mg_l"] = 2.5
        verdict = evaluate_sample(s)
        assert "DO_NOT_RELY_ON_BOILING" in verdict.avoid_actions

    def test_chemical_message_type(self):
        s = safe_base()
        s["arsenic_mg_l"] = 0.08
        verdict = evaluate_sample(s)
        assert verdict.message_type == "CHEMICAL_CONTAMINATION"

    def test_chemical_no_boil_disinfect_in_recommended(self):
        """
        Chemical-only verdict must NOT recommend BOIL_OR_CHLORINATE.
        That would be contradictory since do_not_boil=True.
        """
        s = safe_base()
        s["nitrate_mg_l"] = 55.0
        verdict = evaluate_sample(s)
        assert "BOIL_OR_CHLORINATE" not in verdict.recommended_actions

    # ── PHYSICAL ─────────────────────────────────────────────────────────────

    def test_physical_safe_to_drink_false(self):
        s = safe_base()
        s["turbidity_ntu"] = 18.5
        verdict = evaluate_sample(s)
        assert verdict.safe_to_drink is False

    def test_physical_recommended_actions_include_filter(self):
        s = safe_base()
        s["turbidity_ntu"] = 18.5
        verdict = evaluate_sample(s)
        assert "FILTER_OR_TREAT" in verdict.recommended_actions

    def test_physical_recommended_actions_include_retest(self):
        s = safe_base()
        s["turbidity_ntu"] = 18.5
        verdict = evaluate_sample(s)
        assert "RETEST" in verdict.recommended_actions

    def test_physical_avoid_actions_empty(self):
        """Physical-only parameter concern has no avoid_actions."""
        s = safe_base()
        s["turbidity_ntu"] = 18.5
        verdict = evaluate_sample(s)
        assert verdict.avoid_actions == []

    def test_physical_message_type(self):
        s = safe_base()
        s["turbidity_ntu"] = 18.5
        verdict = evaluate_sample(s)
        assert verdict.message_type == "PHYSICAL_PARAMETER"

    # ── MIXED ─────────────────────────────────────────────────────────────────

    def test_mixed_safe_to_drink_false(self):
        s = safe_base()
        s["arsenic_mg_l"] = 0.08
        s["e_coli_mpn"] = 450
        verdict = evaluate_sample(s)
        assert verdict.safe_to_drink is False

    def test_mixed_recommended_actions_include_alternative_source(self):
        s = safe_base()
        s["arsenic_mg_l"] = 0.08
        s["e_coli_mpn"] = 450
        verdict = evaluate_sample(s)
        assert "USE_ALTERNATIVE_SAFE_SOURCE" in verdict.recommended_actions

    def test_mixed_recommended_actions_include_bio_disinfection(self):
        """Mixed hazard MUST also address biological contamination."""
        s = safe_base()
        s["fluoride_mg_l"] = 2.0
        s["e_coli_mpn"] = 1000
        verdict = evaluate_sample(s)
        assert "DISINFECT_FOR_BIOLOGICAL_CONTAMINATION" in verdict.recommended_actions

    def test_mixed_avoid_actions_include_do_not_rely_on_boiling(self):
        """Mixed hazard with chemical priority must include DO_NOT_RELY_ON_BOILING."""
        s = safe_base()
        s["arsenic_mg_l"] = 0.08
        s["e_coli_mpn"] = 450
        verdict = evaluate_sample(s)
        assert "DO_NOT_RELY_ON_BOILING" in verdict.avoid_actions

    def test_mixed_message_type(self):
        s = safe_base()
        s["fluoride_mg_l"] = 2.0
        s["e_coli_mpn"] = 1000
        verdict = evaluate_sample(s)
        assert verdict.message_type == "MIXED_HAZARD"

    # ── Backward compat: to_dict() must include all new fields ────────────────

    def test_to_dict_includes_all_new_fields(self):
        """The JSON API response must include all structured communication fields."""
        verdict = evaluate_sample(safe_base())
        d = verdict.to_dict()

        # Existing fields must still be present
        assert "category" in d
        assert "severity" in d
        assert "action_code" in d
        assert "do_not_boil" in d
        assert "reasons" in d
        assert "recommended_action" in d
        assert "summary" in d
        assert "parameter_results" in d

        # New fields must be present
        assert "safe_to_drink" in d
        assert "recommended_actions" in d
        assert "avoid_actions" in d
        assert "message_type" in d

        # Type checks
        assert isinstance(d["safe_to_drink"], bool)
        assert isinstance(d["recommended_actions"], list)
        assert isinstance(d["avoid_actions"], list)
        assert isinstance(d["message_type"], str)

    def test_chemical_reasons_do_not_contain_do_not_boil(self):
        """
        The reason text in chemical verdicts must describe the hazard,
        not embed a 'DO NOT BOIL' instruction (that belongs in avoid_actions).
        The avoid_actions field carries the structured avoidance instruction.
        """
        s = safe_base()
        s["fluoride_mg_l"] = 2.5
        verdict = evaluate_sample(s)

        # avoid_actions should carry the structured instruction
        assert "DO_NOT_RELY_ON_BOILING" in verdict.avoid_actions

        # reasons text should describe the hazard scientifically
        reasons_text = " ".join(verdict.reasons).lower()
        assert "fluoride" in reasons_text