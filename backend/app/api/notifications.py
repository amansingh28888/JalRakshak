"""
JalRakshak — Notifications API
================================
Provides authenticated endpoints for viewing and managing
water-quality email notifications, delivery logs, and citizen alerts.

Access Control:
  - Admin:
      * View full delivery logs with multi-field filtering
      * View aggregated delivery stats per alert
      * View affected village's registered citizens and delivery status for any alert
      * Send real/simulated test email to verify Resend configuration
      * Retry failed email deliveries
      * View provider configuration status and warnings
  - Citizen:
      * View ONLY their own village-level notifications
      * View notifications in their preferred language with clear explanation, precautions, and parameters
      * Mark notifications as read / unread
      * Recipient email addresses and contact information of other citizens are strictly masked / inaccessible
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.models.notification_log import NotificationLog
from app.models.water_sample import WaterSample
from app.models.user_profile import UserProfile
from app.api.deps.auth import require_admin, get_current_user
from app.config import get_settings
from app.services.email_service import (
    send_alert_email,
    send_admin_alert_email,
    TRANSLATIONS,
    SUPPORTED_LANGUAGES,
)
from app.services.alert_engine import _build_sample_info, _build_action_codes

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class NotificationLogResponse(BaseModel):
    id: int
    alert_id: int
    citizen_id: Optional[int]
    channel: str
    recipient: str
    recipient_role: str
    language_code: str
    status: str
    is_read: bool = False
    failure_reason: Optional[str]
    attempt_count: int
    provider_message_id: Optional[str]
    sent_at: Optional[datetime]
    created_at: datetime

    # Location & Sample metadata
    village: Optional[str] = None
    district: Optional[str] = None
    state_ut: Optional[str] = None
    severity: Optional[str] = None
    sample_id_str: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationStatsResponse(BaseModel):
    alert_id: int
    sample_id_str: Optional[str]
    village: Optional[str] = None
    district: Optional[str]
    state_ut: Optional[str]
    severity: Optional[str]
    primary_contaminant: Optional[str] = None
    sample_date: Optional[str] = None
    total_notifications: int
    sent: int
    failed: int
    pending: int
    citizen_notified: int
    admin_notified: int
    has_simulation: bool


class ConfigStatusResponse(BaseModel):
    resend_configured: bool
    email_from: str
    admin_alert_email_configured: bool
    warning: Optional[str]


class AlertCitizenRecipientResponse(BaseModel):
    citizen_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state_ut: Optional[str] = None
    notification_status: str  # SENT, FAILED, PENDING, NOT_DISPATCHED
    attempt_count: int = 0
    failure_reason: Optional[str] = None
    sent_at: Optional[datetime] = None
    log_id: Optional[int] = None


class CitizenNotificationItem(BaseModel):
    id: int
    alert_id: int
    status: str
    is_read: bool
    created_at: datetime
    sent_at: Optional[datetime]

    village: Optional[str] = None
    district: Optional[str] = None
    state_ut: Optional[str] = None
    sample_id_str: Optional[str] = None
    severity: Optional[str] = None

    primary_contaminant: Optional[str] = None
    contaminant_value: Optional[str] = None
    contaminant_unit: Optional[str] = None
    contaminant_limit: Optional[str] = None
    do_not_boil: bool = False

    language_code: str
    title: str
    explanation: str
    precautions: List[str]


class TestEmailRequest(BaseModel):
    recipient_email: str
    lang: str = "en"


# ── Helper for Localized Explanations ──────────────────────────────────────────

def _build_localized_citizen_view(sample: WaterSample, lang: str) -> tuple[str, str, list[str]]:
    """Build localized title, explanation, and precautions from verified translations."""
    lang = lang if lang in TRANSLATIONS else "en"
    t = TRANSLATIONS.get(lang, TRANSLATIONS["en"])

    district = sample.district or "Your Area"
    state = sample.state_ut or ""

    title = t.get("subject", "🚨 Water Quality Alert — {district}, {state}").replace(
        "{district}", district
    ).replace("{state}", state)

    explanation = t.get("intro", "JalRakshak has detected a water-quality issue in your area.")

    precautions = []
    if sample.do_not_boil:
        precautions.append(t.get("do_not_boil_warning", "⚠️ DO NOT BOIL THIS WATER — boiling concentrates chemical contaminants and is DANGEROUS."))
        precautions.append("Use an alternative certified safe water source immediately.")
    else:
        precautions.append(t.get("boil_advisory", "✅ Boil water before drinking until further notice."))

    return title, explanation, precautions


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/config-status", response_model=ConfigStatusResponse)
def get_config_status(
    current_user: UserProfile = Depends(require_admin),
    settings=Depends(get_settings),
):
    """Return Resend configuration status for admin dashboard."""
    configured = settings.resend_configured
    warning = None
    if not configured:
        warning = (
            "RESEND_API_KEY is not configured or is set to the test placeholder. "
            "Email notifications are recorded as PENDING (simulation mode). "
            "Set RESEND_API_KEY in backend/.env to enable real email delivery."
        )
    return ConfigStatusResponse(
        resend_configured=configured,
        email_from=settings.email_from,
        admin_alert_email_configured=bool(
            settings.admin_alert_email and settings.admin_alert_email.strip()
        ),
        warning=warning,
    )


@router.post("/admin/test-email")
def send_admin_test_email(
    req: TestEmailRequest,
    current_user: UserProfile = Depends(require_admin),
    settings=Depends(get_settings),
):
    """
    Admin: Send a real or simulated test email to verify provider integration.
    Reports the actual API response and provider_message_id without fake success.
    """
    sample_info = {
        "district": current_user.district or "Test District",
        "state_ut": current_user.state_ut or "Test State",
        "village": current_user.village or "Test Village",
        "severity": "HIGH",
        "sample_id": "TEST-VERIFY-001",
        "sample_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "primary_contaminant": "Nitrate",
        "contaminant_value": 52.4,
        "contaminant_unit": "mg/L",
        "contaminant_limit": 45.0,
        "do_not_boil": True,
        "alert_category": "CRITICAL_CHEMICAL_TOXIN",
        "rule_reason": "Nitrate exceeds IS 10500 permissible limit of 45 mg/L",
    }

    result = send_alert_email(
        to_email=req.recipient_email.strip(),
        citizen_name="Authorized Tester",
        sample_info=sample_info,
        action_codes=["USE_ALTERNATIVE_SAFE_SOURCE"],
        lang=req.lang,
        recipient_role="admin",
    )

    return {
        "success": result.success,
        "simulated": result.simulated,
        "provider_message_id": result.provider_message_id,
        "failure_reason": result.failure_reason,
        "config_warning": result.config_warning,
        "sent_to": req.recipient_email.strip(),
        "provider": "Resend",
    }


@router.get("/admin/logs", response_model=List[NotificationLogResponse])
def list_admin_notification_logs(
    alert_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    recipient_role: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
):
    """Admin: paginated notification log with multi-parameter filtering."""
    q = db.query(NotificationLog)

    if alert_id is not None:
        q = q.filter(NotificationLog.alert_id == alert_id)
    if status:
        q = q.filter(NotificationLog.status == status)
    if recipient_role:
        q = q.filter(NotificationLog.recipient_role == recipient_role)

    q = q.order_by(NotificationLog.created_at.desc())
    logs = q.offset((page - 1) * page_size).limit(page_size).all()

    # Join with water_samples for location details
    sample_ids = {log.alert_id for log in logs}
    samples_by_id: dict[int, WaterSample] = {}
    if sample_ids:
        for s in db.query(WaterSample).filter(WaterSample.id.in_(sample_ids)).all():
            samples_by_id[s.id] = s

    results = []
    for log in logs:
        sample = samples_by_id.get(log.alert_id)
        if village and sample and village.lower() not in (sample.village or "").lower():
            continue
        if district and sample and district.lower() not in (sample.district or "").lower():
            continue

        results.append(
            NotificationLogResponse(
                id=log.id,
                alert_id=log.alert_id,
                citizen_id=log.citizen_id,
                channel=log.channel,
                recipient=log.recipient,
                recipient_role=log.recipient_role,
                language_code=log.language_code,
                status=log.status,
                is_read=getattr(log, "is_read", False),
                failure_reason=log.failure_reason,
                attempt_count=log.attempt_count,
                provider_message_id=log.provider_message_id,
                sent_at=log.sent_at,
                created_at=log.created_at,
                village=sample.village if sample else None,
                district=sample.district if sample else None,
                state_ut=sample.state_ut if sample else None,
                severity=sample.severity if sample else None,
                sample_id_str=sample.sample_id if sample else None,
            )
        )
    return results


@router.get("/admin/stats", response_model=List[NotificationStatsResponse])
def list_admin_notification_stats(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
):
    """
    Admin: aggregated delivery statistics per alert.
    Returns one row per unique alert_id with counts by status.
    """
    try:
        rows = db.execute(
            text("""
                SELECT
                    nl.alert_id,
                    COUNT(*)                                                  AS total_notifications,
                    SUM(CASE WHEN nl.status = 'SENT'    THEN 1 ELSE 0 END)  AS sent,
                    SUM(CASE WHEN nl.status = 'FAILED'  THEN 1 ELSE 0 END)  AS failed,
                    SUM(CASE WHEN nl.status = 'PENDING' THEN 1 ELSE 0 END)  AS pending,
                    SUM(CASE WHEN nl.recipient_role = 'citizen' THEN 1 ELSE 0 END) AS citizen_notified,
                    SUM(CASE WHEN nl.recipient_role = 'admin'   THEN 1 ELSE 0 END) AS admin_notified,
                    SUM(CASE WHEN nl.provider_message_id IS NULL AND nl.status = 'PENDING' THEN 1 ELSE 0 END) AS simulated_count
                FROM notification_logs nl
                GROUP BY nl.alert_id
                ORDER BY nl.alert_id DESC
                LIMIT :limit OFFSET :offset
            """),
            {"limit": page_size, "offset": (page - 1) * page_size},
        ).fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats query failed: {str(e)}")

    alert_ids = [r[0] for r in rows]
    samples_by_id: dict[int, WaterSample] = {}
    if alert_ids:
        for s in db.query(WaterSample).filter(WaterSample.id.in_(alert_ids)).all():
            samples_by_id[s.id] = s

    results = []
    for r in rows:
        sample = samples_by_id.get(r[0])
        results.append(
            NotificationStatsResponse(
                alert_id=r[0],
                sample_id_str=sample.sample_id if sample else None,
                village=sample.village if sample else None,
                district=sample.district if sample else None,
                state_ut=sample.state_ut if sample else None,
                severity=sample.severity if sample else None,
                primary_contaminant=sample.primary_contaminant if sample else None,
                sample_date=sample.sample_date if sample else None,
                total_notifications=r[1],
                sent=r[2],
                failed=r[3],
                pending=r[4],
                citizen_notified=r[5],
                admin_notified=r[6],
                has_simulation=r[7] > 0,
            )
        )
    return results


@router.get("/admin/alert/{alert_id}/citizens", response_model=List[AlertCitizenRecipientResponse])
def get_alert_affected_citizens(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
):
    """
    Admin: view all registered citizens belonging to the affected village for this alert,
    along with their authorized contact details and current notification delivery status.
    """
    sample = db.query(WaterSample).filter(WaterSample.id == alert_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Alert water sample not found")

    village = (sample.village or "").strip()
    district = (sample.district or "").strip()
    state = (sample.state_ut or "").strip()

    if not village:
        # Location ambiguous / no village specified
        return []

    # Query citizens in user_profiles matching the village
    citizens = (
        db.query(UserProfile)
        .filter(
            UserProfile.role == "citizen",
            UserProfile.status == "active",
            UserProfile.email.isnot(None),
        )
        .all()
    )

    # Filter by village (case-insensitive)
    matched_citizens = [
        c for c in citizens
        if (c.village or "").strip().lower() == village.lower()
        and (not district or (c.district or "").strip().lower() == district.lower())
        and (not state or (c.state_ut or "").strip().lower() == state.lower())
    ]

    # Query existing notification logs for this alert
    logs = (
        db.query(NotificationLog)
        .filter(NotificationLog.alert_id == alert_id)
        .all()
    )
    logs_by_citizen_id = {log.citizen_id: log for log in logs if log.citizen_id is not None}
    logs_by_email = {log.recipient.lower(): log for log in logs}

    results = []
    for c in matched_citizens:
        log = logs_by_citizen_id.get(c.id) or logs_by_email.get(c.email.lower())
        results.append(
            AlertCitizenRecipientResponse(
                citizen_id=c.id,
                full_name=c.full_name,
                email=c.email,
                phone=c.phone,
                village=c.village,
                district=c.district,
                state_ut=c.state_ut,
                notification_status=log.status if log else "NOT_DISPATCHED",
                attempt_count=log.attempt_count if log else 0,
                failure_reason=log.failure_reason if log else None,
                sent_at=log.sent_at if log else None,
                log_id=log.id if log else None,
            )
        )
    return results


@router.post("/admin/retry/{log_id}")
def retry_failed_notification(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
):
    """Admin: manually retry a FAILED notification entry."""
    log = db.query(NotificationLog).filter(NotificationLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Notification log not found")

    if log.status == "SENT":
        return {"message": "Notification already sent successfully", "status": "SENT"}

    sample = db.query(WaterSample).filter(WaterSample.id == log.alert_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Associated water sample not found")

    sample_info = _build_sample_info(sample)
    action_codes = _build_action_codes(sample)

    if log.recipient_role == "admin":
        result = send_admin_alert_email(
            to_email=log.recipient,
            admin_name="JalRakshak Admin",
            sample_info=sample_info,
            action_codes=action_codes,
        )
    else:
        lang = log.language_code or "en"
        result = send_alert_email(
            to_email=log.recipient,
            citizen_name="Citizen",
            sample_info=sample_info,
            action_codes=action_codes,
            lang=lang,
            recipient_role=log.recipient_role,
        )

    log.attempt_count = (log.attempt_count or 0) + 1
    if result.simulated:
        log.status = "PENDING"
        log.failure_reason = "Simulated: RESEND_API_KEY is not configured."
    elif result.success:
        log.status = "SENT"
        log.sent_at = datetime.utcnow()
        log.provider_message_id = result.provider_message_id
        log.failure_reason = None
    else:
        log.status = "FAILED"
        log.failure_reason = result.failure_reason

    db.commit()

    return {
        "message": "Retry attempted",
        "status": log.status,
        "simulated": result.simulated,
        "config_warning": result.config_warning,
    }


# ── Citizen endpoints ─────────────────────────────────────────────────────────

@router.get("/citizen/my", response_model=List[CitizenNotificationItem])
def get_my_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Citizen: view rich notification cards for their registered village.
    Strictly isolated: a citizen can NEVER view another user's notifications.
    """
    # Security: filter by authenticated user's ID
    q = (
        db.query(NotificationLog)
        .filter(
            NotificationLog.citizen_id == current_user.id,
            NotificationLog.recipient_role == "citizen",
        )
        .order_by(NotificationLog.created_at.desc())
    )

    logs = q.offset((page - 1) * page_size).limit(page_size).all()

    sample_ids = {log.alert_id for log in logs}
    samples_by_id: dict[int, WaterSample] = {}
    if sample_ids:
        for s in db.query(WaterSample).filter(WaterSample.id.in_(sample_ids)).all():
            samples_by_id[s.id] = s

    results = []
    preferred_lang = getattr(current_user, "preferred_language", "en") or "en"

    for log in logs:
        sample = samples_by_id.get(log.alert_id)
        if not sample:
            continue

        lang = log.language_code or preferred_lang
        title, explanation, precautions = _build_localized_citizen_view(sample, lang)

        # Contaminant value formatting
        val_str = None
        if sample.primary_contaminant:
            _col_map = {
                "Fluoride":   sample.fluoride_mg_l,
                "Nitrate":    sample.nitrate_mg_l,
                "Arsenic":    sample.arsenic_mg_l,
                "Iron":       sample.iron_mg_l,
                "Uranium":    sample.uranium_ug_l,
                "pH":         sample.ph,
            }
            for k, val in _col_map.items():
                if k.lower() in sample.primary_contaminant.lower() and val is not None:
                    val_str = str(round(val, 4))
                    break

        results.append(
            CitizenNotificationItem(
                id=log.id,
                alert_id=log.alert_id,
                status=log.status,
                is_read=getattr(log, "is_read", False),
                created_at=log.created_at,
                sent_at=log.sent_at,
                village=sample.village,
                district=sample.district,
                state_ut=sample.state_ut,
                sample_id_str=sample.sample_id,
                severity=sample.severity,
                primary_contaminant=sample.primary_contaminant,
                contaminant_value=val_str,
                contaminant_unit="mg/L" if sample.primary_contaminant and "pH" not in sample.primary_contaminant else "",
                contaminant_limit="IS 10500 Standard",
                do_not_boil=bool(sample.do_not_boil),
                language_code=lang,
                title=title,
                explanation=explanation,
                precautions=precautions,
            )
        )
    return results


@router.post("/citizen/read/{log_id}")
def mark_notification_as_read(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
):
    """Citizen: mark a specific notification as read."""
    log = (
        db.query(NotificationLog)
        .filter(
            NotificationLog.id == log_id,
            NotificationLog.citizen_id == current_user.id,
        )
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail="Notification not found")

    log.is_read = True
    db.commit()
    return {"message": "Notification marked as read", "id": log_id, "is_read": True}


@router.post("/citizen/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
):
    """Citizen: mark all own notifications as read."""
    db.query(NotificationLog).filter(
        NotificationLog.citizen_id == current_user.id,
        NotificationLog.recipient_role == "citizen",
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


# ── Webhook endpoint ──────────────────────────────────────────────────────────

@router.post("/webhook/resend")
async def handle_resend_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Handle Resend delivery webhooks securely (e.g. email.delivered, email.bounced).
    Updates NotificationLog with confirmed delivery status.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = body.get("type")
    data = body.get("data", {})
    email_id = data.get("email_id") or data.get("id")

    if not email_id:
        return {"status": "ignored", "reason": "No email_id in event"}

    log = db.query(NotificationLog).filter(NotificationLog.provider_message_id == email_id).first()
    if not log:
        return {"status": "not_found", "email_id": email_id}

    if event_type == "email.delivered":
        log.status = "DELIVERED"
        log.failure_reason = None
    elif event_type in ("email.bounced", "email.failed"):
        log.status = "FAILED"
        log.failure_reason = f"Provider event: {event_type} ({data.get('bounce', {}).get('message', 'bounced')})"
    elif event_type == "email.complained":
        log.failure_reason = "Provider event: spam complaint received"

    db.commit()
    return {"status": "processed", "event": event_type, "log_id": log.id}
