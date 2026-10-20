"""
JalRakshak — Alert Engine
=========================
Processes water-quality alert notifications when a new sample is saved.

Trigger contract:
  - Called as a FastAPI BackgroundTask from POST /api/worker/samples
  - Only runs if sample severity is CRITICAL or HIGH (rule engine decision)
  - Never notifies citizens from unrelated districts
  - Deduplicates: one EMAIL notification per (alert_id, citizen_id) pair
  - Logs every delivery attempt in notification_logs table

Multilingual delivery:
  - Looks up citizen's preferred_language from citizen_profiles (Supabase table)
  - Falls back to state-language mapping, then English
  - Language priority: citizen_profiles.preferred_language > state_map > English

Admin notification:
  - Sends a technical summary email to ADMIN_ALERT_EMAIL (if configured)
  - Contains delivery statistics and rule-engine reason

Security:
  - Recipient matching is ALWAYS on the backend — never trusts frontend input
  - Citizens are matched by district — NOT by village, to avoid false negatives
    when a village has water problems affecting neighbouring areas
  - All DB queries use parameterised statements
"""

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.water_sample import WaterSample
from app.models.notification_log import NotificationLog
from app.services.email_service import (
    send_alert_email,
    send_admin_alert_email,
    SUPPORTED_LANGUAGES,
)
from app.database import SessionLocal
from app.config import get_settings

logger = logging.getLogger(__name__)

# State → primary language code fallback (ISO 639-1)
# Used when a citizen has not set a preferred_language.
STATE_LANGUAGE_MAP: dict[str, str] = {
    "Punjab": "pa",
    "Haryana": "hi",
    "Uttar Pradesh": "hi",
    "Bihar": "hi",
    "Jharkhand": "hi",
    "Madhya Pradesh": "hi",
    "Rajasthan": "hi",
    "Delhi": "hi",
    "Himachal Pradesh": "hi",
    "Uttarakhand": "hi",
    "Chhattisgarh": "hi",
    "West Bengal": "bn",
    "Assam": "as",
    "Odisha": "or",
    "Maharashtra": "mr",
    "Gujarat": "gu",
    "Tamil Nadu": "ta",
    "Andhra Pradesh": "te",
    "Telangana": "te",
    "Karnataka": "kn",
    "Kerala": "ml",
    "Jammu and Kashmir": "ur",
    "Goa": "en",
    "Sikkim": "en",
    "Tripura": "bn",
    "Meghalaya": "en",
    "Manipur": "en",
    "Nagaland": "en",
    "Arunachal Pradesh": "en",
    "Mizoram": "en",
}

# Number of send retries before giving up
MAX_RETRY_ATTEMPTS = 3


def _resolve_language(preferred_lang: Optional[str], state: Optional[str]) -> str:
    """
    Resolve the email language for a citizen.
    Priority: citizen preference > state default > English
    """
    if preferred_lang and preferred_lang.strip().lower() in SUPPORTED_LANGUAGES:
        return preferred_lang.strip().lower()
    if state and state in STATE_LANGUAGE_MAP:
        return STATE_LANGUAGE_MAP[state]
    return "en"


def _build_action_codes(sample: WaterSample) -> list[str]:
    """Derive recommended action codes from sample classification."""
    from app.rules.standards import AlertCategory
    _CATEGORY_TO_ACTIONS = {
        AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN: [
            "BOIL_OR_CHLORINATE",
            "DISINFECT_BEFORE_DRINKING",
        ],
        AlertCategory.CRITICAL_CHEMICAL_TOXIN: [
            "USE_ALTERNATIVE_SAFE_SOURCE",
            "USE_APPROPRIATE_CHEMICAL_TREATMENT",
        ],
        AlertCategory.MODERATE_PHYSICAL_PARAM: [
            "FILTER_OR_TREAT",
            "RETEST",
        ],
        AlertCategory.CRITICAL_MIXED_HAZARD: [
            "USE_ALTERNATIVE_SAFE_SOURCE",
            "USE_APPROPRIATE_CHEMICAL_TREATMENT",
            "DISINFECT_FOR_BIOLOGICAL_CONTAMINATION",
        ],
    }
    return _CATEGORY_TO_ACTIONS.get(sample.alert_category or "", [])


def _build_sample_info(sample: WaterSample) -> dict:
    """Build the sample_info dict used by both citizen and admin emails."""
    info: dict = {
        "district": sample.district,
        "state_ut": sample.state_ut,
        "village": sample.village,
        "severity": sample.severity,
        "sample_id": sample.sample_id,
        "sample_date": sample.sample_date,
        "primary_contaminant": sample.primary_contaminant,
        "do_not_boil": sample.do_not_boil,
        "alert_category": sample.alert_category,
        "rule_reason": sample.rule_reason,
    }

    # Add numeric contaminant detail when available
    if sample.primary_contaminant:
        _col_map = {
            "Fluoride":   ("fluoride_mg_l",  "mg/L", 1.5),
            "Nitrate":    ("nitrate_mg_l",   "mg/L", 45.0),
            "Arsenic":    ("arsenic_mg_l",   "mg/L", 0.01),
            "Iron":       ("iron_mg_l",      "mg/L", 1.0),
            "Uranium":    ("uranium_ug_l",   "µg/L", 30.0),
            "pH":         ("ph",             "pH",   8.5),
            "E. Coli":    ("e_coli_mpn",     "MPN/100mL", 0),
            "Coliform":   ("total_coliform_mpn", "MPN/100mL", 0),
        }
        for key, (attr, unit, limit) in _col_map.items():
            if key.lower() in sample.primary_contaminant.lower():
                val = getattr(sample, attr, None)
                if val is not None:
                    info["contaminant_value"] = round(val, 4)
                    info["contaminant_unit"] = unit
                    info["contaminant_limit"] = limit
                break
        else:
            info["contaminant_value"] = "Detected"
            info["contaminant_unit"] = ""
            info["contaminant_limit"] = "Standard Limit"

    return info


def process_alerts_for_sample(sample_id: int) -> None:
    """
    Background task: generate email notifications for a new sample.

    Steps:
      1. Load sample from SQLAlchemy DB (SQLite or Supabase-backed)
      2. Guard: only CRITICAL or HIGH severity triggers alerts
      3. Query citizen_profiles from Supabase PostgreSQL for district match
      4. Deduplicate against notification_logs
      5. Send citizen emails (with language preference)
      6. Send admin summary email
      7. Persist all NotificationLog records
    """
    settings = get_settings()
    db: Session = SessionLocal()

    try:
        sample = db.query(WaterSample).filter(WaterSample.id == sample_id).first()
        if not sample:
            logger.error(f"process_alerts_for_sample: Sample {sample_id} not found.")
            return

        # ── Guard: only alert on actionable severity ──────────────────────────
        if sample.severity not in ("CRITICAL", "HIGH"):
            logger.info(
                f"Sample {sample_id} severity={sample.severity!r}: no alert needed."
            )
            return

        state = sample.state_ut
        district = sample.district

        if not state or not district:
            logger.error(
                f"Sample {sample_id}: missing state or district, cannot route alerts."
            )
            return

        logger.info(
            f"Processing alerts for sample {sample_id} "
            f"({district}, {state}) severity={sample.severity}"
        )

        sample_info = _build_sample_info(sample)
        action_codes = _build_action_codes(sample)

        # ── Fetch matching citizens by village ─────────────────────────────────
        citizens: list[tuple] = []
        village = (sample.village or "").strip()
        location_ambiguous = not bool(village)

        if location_ambiguous:
            logger.warning(
                f"Sample {sample_id}: Location is ambiguous or incomplete (village is missing). "
                f"Flagging for admin review; no citizen emails dispatched to unrelated villages."
            )
        else:
            supabase_available = bool(
                settings.supabase_database_url and settings.supabase_database_url.strip()
            )

            if supabase_available:
                try:
                    rows = db.execute(
                        text("""
                            SELECT
                                up.id          AS user_profile_id,
                                up.full_name,
                                up.email,
                                up.state_ut,
                                COALESCE(NULLIF(up.preferred_language, ''), cp.preferred_language, '') AS preferred_language
                            FROM user_profiles up
                            LEFT JOIN public.citizen_profiles cp
                                ON cp.user_id::text = up.auth_user_id
                            WHERE up.role = 'citizen'
                              AND up.status = 'active'
                              AND up.email IS NOT NULL
                              AND LOWER(TRIM(up.village)) = LOWER(TRIM(:village))
                              AND LOWER(TRIM(up.district)) = LOWER(TRIM(:district))
                              AND LOWER(TRIM(up.state_ut)) = LOWER(TRIM(:state))
                        """),
                        {"village": village, "district": district, "state": state},
                    ).fetchall()
                    citizens = [
                        (r.user_profile_id, r.full_name, r.email,
                         r.state_ut, r.preferred_language)
                        for r in rows
                    ]
                    logger.info(
                        f"Found {len(citizens)} registered citizens in village {village}, {district}, {state}"
                    )
                except Exception as e:
                    logger.warning(
                        f"Supabase citizen query failed: {e}"
                    )
            else:
                # SQLite fallback: query user_profiles directly
                try:
                    rows = db.execute(
                        text("""
                            SELECT id, full_name, email, state_ut, COALESCE(preferred_language, 'en') AS preferred_language
                            FROM user_profiles
                            WHERE role = 'citizen'
                              AND status = 'active'
                              AND email IS NOT NULL
                              AND LOWER(TRIM(village)) = LOWER(TRIM(:village))
                              AND LOWER(TRIM(district)) = LOWER(TRIM(:district))
                              AND LOWER(TRIM(state_ut)) = LOWER(TRIM(:state))
                        """),
                        {"village": village, "district": district, "state": state},
                    ).fetchall()
                    citizens = [
                        (r[0], r[1], r[2], r[3], r[4])
                        for r in rows
                    ]
                    logger.info(
                        f"(SQLite) Found {len(citizens)} registered citizens in village {village}, {district}, {state}"
                    )
                except Exception as e:
                    logger.error(f"SQLite citizen query failed: {e}")

        # ── Send citizen emails ────────────────────────────────────────────────
        sent_count = 0
        failed_count = 0
        pending_count = 0

        for (profile_id, full_name, email, cit_state, preferred_lang) in citizens:
            # Deduplicate: skip if already notified for this alert
            existing = (
                db.query(NotificationLog)
                .filter(
                    NotificationLog.alert_id == sample.id,
                    NotificationLog.citizen_id == profile_id,
                    NotificationLog.channel == "EMAIL",
                )
                .first()
            )
            if existing:
                logger.info(
                    f"Skipping duplicate notification: alert={sample.id} citizen={profile_id}"
                )
                continue

            lang = _resolve_language(preferred_lang, cit_state or state)

            # Attempt delivery (with bounded retry)
            result = None
            for attempt in range(1, MAX_RETRY_ATTEMPTS + 1):
                result = send_alert_email(
                    to_email=email,
                    citizen_name=full_name,
                    sample_info=sample_info,
                    action_codes=action_codes,
                    lang=lang,
                    recipient_role="citizen",
                )
                if result.success:
                    break
                logger.warning(
                    f"Email attempt {attempt}/{MAX_RETRY_ATTEMPTS} failed "
                    f"for {email}: {result.failure_reason}"
                )

            # Real delivery status tracking — NEVER claim sent if simulated or failed
            if result and result.simulated:
                status = "PENDING"
                failure_reason = "Simulated delivery: RESEND_API_KEY is not configured. Notification recorded as PENDING."
                pending_count += 1
            elif result and result.success:
                status = "SENT"
                failure_reason = None
                sent_count += 1
            else:
                status = "FAILED"
                failure_reason = result.failure_reason if result else "Send failed"
                failed_count += 1

            log_entry = NotificationLog(
                alert_id=sample.id,
                citizen_id=profile_id,
                channel="EMAIL",
                recipient=email,
                recipient_role="citizen",
                language_code=lang,
                status=status,
                failure_reason=failure_reason,
                attempt_count=attempt if result else 1,
                provider_message_id=(
                    result.provider_message_id if result and result.success and not result.simulated else None
                ),
                sent_at=datetime.utcnow() if status == "SENT" else None,
                is_read=False,
            )
            db.add(log_entry)

        db.commit()

        # ── Admin notification ─────────────────────────────────────────────────
        admin_email = settings.admin_alert_email
        if admin_email and admin_email.strip():
            notification_stats = {
                "total": len(citizens),
                "sent": sent_count,
                "failed": failed_count,
            }
            admin_result = send_admin_alert_email(
                to_email=admin_email.strip(),
                admin_name="JalRakshak Admin",
                sample_info=sample_info,
                action_codes=action_codes,
                notification_stats=notification_stats,
            )

            admin_log = NotificationLog(
                alert_id=sample.id,
                citizen_id=None,
                channel="EMAIL",
                recipient=admin_email.strip(),
                recipient_role="admin",
                language_code="en",
                status="SENT" if (admin_result.success and not admin_result.simulated) else ("PENDING" if admin_result.simulated else "FAILED"),
                failure_reason=(
                    "Simulated delivery: RESEND_API_KEY is not configured."
                    if admin_result.simulated
                    else admin_result.failure_reason
                ),
                attempt_count=1,
                provider_message_id=admin_result.provider_message_id if not admin_result.simulated else None,
                sent_at=datetime.utcnow() if (admin_result.success and not admin_result.simulated) else None,
            )
            db.add(admin_log)
            db.commit()
        else:
            logger.info(
                "ADMIN_ALERT_EMAIL not configured — admin notification skipped."
            )

        logger.info(
            f"Alert processing complete for sample {sample_id}: "
            f"{sent_count} sent, {failed_count} failed"
        )

    except Exception as e:
        logger.error(f"Unhandled error processing alerts for sample {sample_id}: {e}", exc_info=True)
        try:
            db.rollback()
        except Exception:
            pass

    finally:
        db.close()
