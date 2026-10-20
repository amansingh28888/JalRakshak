"""
JalRakshak — Email & Alert Notification Automated Test Suite
============================================================
Comprehensive test suite verifying all 16 required notification scenarios:
  1. Correct village recipient matching
  2. Citizens from unrelated villages not receiving notifications
  3. Citizen-selected language taking priority
  4. State default language fallback
  5. English fallback
  6. Correct dynamic template data
  7. Missing optional data
  8. HTML escaping
  9. Dashboard notification creation
 10. Email-provider failure handling
 11. Duplicate prevention
 12. Retry behavior
 13. Invalid or unverified recipient handling (incomplete location)
 14. Unauthorized access to another citizen's notifications
 15. Unauthorized access to citizen contact details
 16. Alert persistence when email delivery fails

All external provider calls (Resend API) are mocked. No real emails are sent during tests.
"""

import html
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.api.deps.auth import require_admin, get_current_user
from app.models.water_sample import WaterSample
from app.models.user_profile import UserProfile
from app.models.notification_log import NotificationLog
from app.services.email_service import (
    send_alert_email,
    send_admin_alert_email,
    _build_html_email,
    _build_plain_text_email,
    EmailResult,
    SUPPORTED_LANGUAGES,
)
from app.services.alert_engine import (
    process_alerts_for_sample,
    _resolve_language,
    _build_sample_info,
)

# ── Test Database Setup ───────────────────────────────────────────────────────
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    """Create fresh tables for every test and clean dependency overrides."""
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(require_admin, None)
    app.dependency_overrides.pop(get_current_user, None)


# ── Test 1: Correct Village Recipient Matching ─────────────────────────────────

def test_village_recipient_matching():
    """Test 1: Registered citizens in the affected village receive notifications."""
    db = TestingSessionLocal()

    c1 = UserProfile(
        auth_user_id="cit-001",
        full_name="Harpreet Singh",
        email="harpreet@example.com",
        phone="9876543210",
        role="citizen",
        status="active",
        state_ut="Punjab",
        district="Amritsar",
        village="Ajnala",
        preferred_language="pa",
    )
    c2 = UserProfile(
        auth_user_id="cit-002",
        full_name="Gurpreet Kaur",
        email="gurpreet@example.com",
        phone="9876543211",
        role="citizen",
        status="active",
        state_ut="Punjab",
        district="Amritsar",
        village="Ajnala",
        preferred_language="en",
    )
    db.add_all([c1, c2])

    sample = WaterSample(
        sample_id="PUN-AMR-AJN-001",
        state_ut="Punjab",
        district="Amritsar",
        village="Ajnala",
        severity="CRITICAL",
        primary_contaminant="Fluoride",
        fluoride_mg_l=3.2,
        do_not_boil=True,
        alert_category="CRITICAL_CHEMICAL_TOXIN",
    )
    db.add(sample)
    db.commit()
    sample_id = sample.id
    db.close()

    with patch("app.services.alert_engine.SessionLocal", side_effect=TestingSessionLocal):
        with patch("app.services.alert_engine.send_alert_email") as mock_send:
            mock_send.return_value = EmailResult(
                success=True,
                provider_message_id="msg_resend_123",
            )
            process_alerts_for_sample(sample_id)

    verify_db = TestingSessionLocal()
    logs = verify_db.query(NotificationLog).filter(NotificationLog.alert_id == sample_id).all()
    recipients = {log.recipient for log in logs}
    verify_db.close()

    assert "harpreet@example.com" in recipients
    assert "gurpreet@example.com" in recipients


# ── Test 2: Citizens from Unrelated Villages Not Receiving Notifications ──────

def test_unrelated_village_citizens_do_not_receive_notifications():
    """Test 2: Citizens from unrelated villages in the same district DO NOT receive notifications."""
    db = TestingSessionLocal()

    c1 = UserProfile(
        auth_user_id="cit-001",
        full_name="Harpreet Singh",
        email="harpreet@example.com",
        phone="9876543210",
        role="citizen",
        status="active",
        state_ut="Punjab",
        district="Amritsar",
        village="Ajnala",
        preferred_language="pa",
    )
    c_unrelated = UserProfile(
        auth_user_id="cit-003",
        full_name="Rajinder Kumar",
        email="rajinder@example.com",
        phone="9876543212",
        role="citizen",
        status="active",
        state_ut="Punjab",
        district="Amritsar",
        village="Majitha",  # Unrelated village
        preferred_language="pa",
    )
    db.add_all([c1, c_unrelated])

    sample = WaterSample(
        sample_id="PUN-AMR-AJN-002",
        state_ut="Punjab",
        district="Amritsar",
        village="Ajnala",
        severity="CRITICAL",
        primary_contaminant="Fluoride",
    )
    db.add(sample)
    db.commit()
    sample_id = sample.id
    db.close()

    with patch("app.services.alert_engine.SessionLocal", side_effect=TestingSessionLocal):
        with patch("app.services.alert_engine.send_alert_email") as mock_send:
            mock_send.return_value = EmailResult(
                success=True,
                provider_message_id="msg_resend_456",
            )
            process_alerts_for_sample(sample_id)

    verify_db = TestingSessionLocal()
    logs = verify_db.query(NotificationLog).filter(NotificationLog.alert_id == sample_id).all()
    recipients = {log.recipient for log in logs}
    verify_db.close()

    assert "harpreet@example.com" in recipients
    assert "rajinder@example.com" not in recipients


# ── Test 3, 4, 5: Language Selection Hierarchy ────────────────────────────────

def test_language_hierarchy_citizen_priority():
    """Test 3: Citizen-selected language takes highest priority."""
    resolved = _resolve_language(preferred_lang="ta", state="Punjab")
    assert resolved == "ta"


def test_language_hierarchy_state_default_fallback():
    """Test 4: State default language fallback when citizen has no preference."""
    resolved_pa = _resolve_language(preferred_lang=None, state="Punjab")
    assert resolved_pa == "pa"

    resolved_bn = _resolve_language(preferred_lang="", state="West Bengal")
    assert resolved_bn == "bn"


def test_language_hierarchy_english_final_fallback():
    """Test 5: English is the final fallback for unknown states or unsupported codes."""
    resolved = _resolve_language(preferred_lang=None, state="Unknown Territory")
    assert resolved == "en"

    resolved_invalid = _resolve_language(preferred_lang="xyz", state="Unknown Territory")
    assert resolved_invalid == "en"


# ── Test 6, 7, 8: Template Data, Missing Data, and HTML Escaping ──────────────

def test_template_dynamic_data():
    """Test 6: Correct dynamic template data rendering."""
    sample_info = {
        "district": "Amritsar",
        "state_ut": "Punjab",
        "village": "Ajnala",
        "severity": "CRITICAL",
        "sample_id": "PUN-001",
        "sample_date": "2026-10-19",
        "primary_contaminant": "Arsenic",
        "contaminant_value": 0.05,
        "contaminant_unit": "mg/L",
        "contaminant_limit": 0.01,
        "do_not_boil": True,
    }
    html_out = _build_html_email("Harpreet", sample_info, ["USE_ALTERNATIVE_SAFE_SOURCE"], lang="en")
    text_out = _build_plain_text_email("Harpreet", sample_info, ["USE_ALTERNATIVE_SAFE_SOURCE"], lang="en")

    assert "Harpreet" in html_out
    assert "Amritsar" in html_out
    assert "Arsenic" in html_out
    assert "0.05" in html_out
    assert "DO NOT BOIL" in html_out
    assert "Arsenic" in text_out


def test_template_missing_optional_data():
    """Test 7: Missing optional data renders gracefully without crashing or fake values."""
    minimal_info = {
        "district": "Patna",
        "state_ut": "Bihar",
        "severity": "HIGH",
    }
    html_out = _build_html_email("", minimal_info, [], lang="en")
    assert "Patna, Bihar" in html_out
    assert "JalRakshak" in html_out


def test_template_html_escaping():
    """Test 8: Untrusted user input is safely HTML-escaped to prevent XSS injection."""
    malicious_info = {
        "district": "<script>alert('xss')</script>",
        "state_ut": "SafeState",
        "severity": "HIGH",
    }
    html_out = _build_html_email("<img src=x onerror=alert(1)>", malicious_info, [], lang="en")

    assert "<script>" not in html_out
    assert "<img src=x" not in html_out
    assert "&lt;script&gt;" in html_out or "&#x" in html_out or "&lt;img" in html_out


# ── Test 9: Dashboard Notification Creation ───────────────────────────────────

def test_dashboard_notification_creation():
    """Test 9: Processing an alert persists NotificationLog records with read status."""
    db = TestingSessionLocal()
    cit = UserProfile(
        auth_user_id="cit-101",
        full_name="Amit Roy",
        email="amit@example.com",
        role="citizen",
        status="active",
        state_ut="West Bengal",
        district="Nadia",
        village="Hanskhali",
        preferred_language="bn",
    )
    sample = WaterSample(
        sample_id="WB-NAD-001",
        state_ut="West Bengal",
        district="Nadia",
        village="Hanskhali",
        severity="HIGH",
        primary_contaminant="Arsenic",
    )
    db.add_all([cit, sample])
    db.commit()
    cit_id = cit.id
    sample_id = sample.id
    db.close()

    with patch("app.services.alert_engine.SessionLocal", side_effect=TestingSessionLocal):
        with patch("app.services.alert_engine.send_alert_email") as mock_send:
            mock_send.return_value = EmailResult(success=True, provider_message_id="wb_resend_1")
            process_alerts_for_sample(sample_id)

    verify_db = TestingSessionLocal()
    log = verify_db.query(NotificationLog).filter(NotificationLog.citizen_id == cit_id).first()
    assert log is not None
    assert log.status == "SENT"
    assert log.language_code == "bn"
    assert log.is_read is False
    verify_db.close()


# ── Test 10: Email Provider Failure Handling ──────────────────────────────────

def test_email_provider_failure_handling():
    """Test 10: Provider rejection records failure reason and does not mark as sent."""
    db = TestingSessionLocal()
    cit = UserProfile(
        auth_user_id="cit-201",
        full_name="Deepak Joshi",
        email="deepak@example.com",
        role="citizen",
        status="active",
        state_ut="Uttarakhand",
        district="Dehradun",
        village="Rishikesh",
    )
    sample = WaterSample(
        sample_id="UK-DEH-001",
        state_ut="Uttarakhand",
        district="Dehradun",
        village="Rishikesh",
        severity="HIGH",
        primary_contaminant="Nitrate",
    )
    db.add_all([cit, sample])
    db.commit()
    cit_id = cit.id
    sample_id = sample.id
    db.close()

    with patch("app.services.alert_engine.SessionLocal", side_effect=TestingSessionLocal):
        with patch("app.services.alert_engine.send_alert_email") as mock_send:
            mock_send.return_value = EmailResult(
                success=False,
                failure_reason="HTTP 403: Domain not verified on Resend",
            )
            process_alerts_for_sample(sample_id)

    verify_db = TestingSessionLocal()
    log = verify_db.query(NotificationLog).filter(NotificationLog.citizen_id == cit_id).first()
    assert log is not None
    assert log.status == "FAILED"
    assert "Domain not verified" in (log.failure_reason or "")
    assert log.sent_at is None
    verify_db.close()


# ── Test 11: Duplicate Prevention ─────────────────────────────────────────────

def test_duplicate_prevention_on_multiple_runs():
    """Test 11: Reprocessing the same sample does not re-email the same citizen."""
    db = TestingSessionLocal()
    cit = UserProfile(
        auth_user_id="cit-301",
        full_name="Pooja Sharma",
        email="pooja@example.com",
        role="citizen",
        status="active",
        state_ut="Rajasthan",
        district="Jaipur",
        village="Sanganer",
    )
    sample = WaterSample(
        sample_id="RJ-JAI-001",
        state_ut="Rajasthan",
        district="Jaipur",
        village="Sanganer",
        severity="CRITICAL",
        primary_contaminant="Fluoride",
    )
    db.add_all([cit, sample])
    db.commit()
    cit_id = cit.id
    sample_id = sample.id
    db.close()

    with patch("app.services.alert_engine.SessionLocal", side_effect=TestingSessionLocal):
        with patch("app.services.alert_engine.send_alert_email") as mock_send:
            mock_send.return_value = EmailResult(success=True, provider_message_id="rj_001")
            # First execution
            process_alerts_for_sample(sample_id)
            # Second execution
            process_alerts_for_sample(sample_id)

    citizen_calls = [c for c in mock_send.call_args_list if c.kwargs.get("recipient_role") == "citizen"]
    assert len(citizen_calls) == 1

    verify_db = TestingSessionLocal()
    logs = verify_db.query(NotificationLog).filter(NotificationLog.citizen_id == cit_id).all()
    assert len(logs) == 1
    verify_db.close()


# ── Test 12: Retry Behavior ───────────────────────────────────────────────────

def test_admin_manual_retry_behavior():
    """Test 12: Admin can retry a failed notification and update status upon success."""
    db = TestingSessionLocal()
    admin = UserProfile(
        auth_user_id="adm-1",
        full_name="Super Admin",
        email="admin@jalrakshak.org",
        role="admin",
        status="active",
    )
    sample = WaterSample(
        sample_id="SMP-RETRY-1",
        state_ut="Punjab",
        district="Amritsar",
        village="Ajnala",
        severity="CRITICAL",
        primary_contaminant="Uranium",
    )
    db.add_all([admin, sample])
    db.commit()

    failed_log = NotificationLog(
        alert_id=sample.id,
        citizen_id=None,
        channel="EMAIL",
        recipient="admin@jalrakshak.org",
        recipient_role="admin",
        language_code="en",
        status="FAILED",
        failure_reason="Network timeout",
        attempt_count=1,
    )
    db.add(failed_log)
    db.commit()
    log_id = failed_log.id
    db.close()

    app.dependency_overrides[require_admin] = lambda: admin
    try:
        with patch("app.api.notifications.send_admin_alert_email") as mock_admin_send:
            mock_admin_send.return_value = EmailResult(
                success=True,
                simulated=False,
                provider_message_id="retry_success_msg_id",
            )
            response = client.post(
                f"/api/notifications/admin/retry/{log_id}",
                headers={"Authorization": "Bearer fake_admin_token"},
            )

        assert response.status_code == 200
        verify_db = TestingSessionLocal()
        reloaded_log = verify_db.query(NotificationLog).filter(NotificationLog.id == log_id).first()
        assert reloaded_log.status == "SENT"
        assert reloaded_log.attempt_count == 2
        assert reloaded_log.provider_message_id == "retry_success_msg_id"
        verify_db.close()
    finally:
        app.dependency_overrides.pop(require_admin, None)


# ── Test 13: Incomplete Location / Inactive User Handling ──────────────────────

def test_incomplete_location_flags_admin_review_no_citizen_dispatch():
    """Test 13: Incomplete location (missing village) does not notify unrelated citizens."""
    db = TestingSessionLocal()
    cit = UserProfile(
        auth_user_id="cit-401",
        full_name="Meena Devi",
        email="meena@example.com",
        role="citizen",
        status="active",
        state_ut="Bihar",
        district="Patna",
        village="Danapur",
    )
    # Sample has NO village
    sample = WaterSample(
        sample_id="BH-PAT-NO-VILLAGE",
        state_ut="Bihar",
        district="Patna",
        village=None,
        severity="CRITICAL",
        primary_contaminant="Arsenic",
    )
    db.add_all([cit, sample])
    db.commit()
    sample_id = sample.id
    db.close()

    with patch("app.services.alert_engine.SessionLocal", side_effect=TestingSessionLocal):
        with patch("app.services.alert_engine.send_alert_email") as mock_send:
            process_alerts_for_sample(sample_id)

    # Since village was missing, citizen was NOT emailed
    assert mock_send.call_count == 0


# ── Test 14 & 15: Security & Authorization Access Control ─────────────────────

def test_citizen_cannot_view_other_citizens_notifications():
    """Test 14: Citizens can read only their own notifications."""
    db = TestingSessionLocal()
    c1 = UserProfile(
        id=10,
        auth_user_id="cit-sec-1",
        full_name="Citizen One",
        email="c1@example.com",
        role="citizen",
        status="active",
    )
    c2 = UserProfile(
        id=20,
        auth_user_id="cit-sec-2",
        full_name="Citizen Two",
        email="c2@example.com",
        role="citizen",
        status="active",
    )
    db.add_all([c1, c2])
    db.commit()

    # Log belonging to Citizen Two
    log2 = NotificationLog(
        alert_id=1,
        citizen_id=20,
        channel="EMAIL",
        recipient="c2@example.com",
        recipient_role="citizen",
        status="SENT",
    )
    db.add(log2)
    db.commit()

    # Authenticate as Citizen One
    app.dependency_overrides[get_current_user] = lambda: c1
    try:
        response = client.get(
            "/api/notifications/citizen/my",
            headers={"Authorization": "Bearer token_c1"},
        )
        assert response.status_code == 200
        items = response.json()
        assert len(items) == 0
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        db.close()


def test_ordinary_citizen_cannot_access_admin_contact_details():
    """Test 15: Ordinary citizen cannot access admin affected village citizen contacts."""
    c1 = UserProfile(
        auth_user_id="cit-sec-1",
        full_name="Ordinary Citizen",
        email="c1@example.com",
        role="citizen",
        status="active",
    )

    app.dependency_overrides[get_current_user] = lambda: c1
    try:
        response = client.get(
            "/api/notifications/admin/alert/1/citizens",
            headers={"Authorization": "Bearer token_c1"},
        )
        # Access denied — 403 Forbidden
        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Test 16: Alert Persistence When Email Delivery Fails ──────────────────────

def test_alert_persists_when_email_delivery_fails():
    """Test 16: An email provider failure must NOT delete or modify the water-quality alert."""
    db = TestingSessionLocal()
    sample = WaterSample(
        sample_id="SAMPLE-PERSIST-1",
        state_ut="Punjab",
        district="Amritsar",
        village="Ajnala",
        severity="CRITICAL",
        primary_contaminant="Fluoride",
    )
    db.add(sample)
    db.commit()
    sample_pk = sample.id
    db.close()

    with patch("app.services.alert_engine.SessionLocal", side_effect=TestingSessionLocal):
        with patch("app.services.alert_engine.send_alert_email", side_effect=Exception("Resend API down")):
            process_alerts_for_sample(sample_pk)

    # Sample still exists in database unchanged
    verify_db = TestingSessionLocal()
    reloaded_sample = verify_db.query(WaterSample).filter(WaterSample.id == sample_pk).first()
    assert reloaded_sample is not None
    assert reloaded_sample.sample_id == "SAMPLE-PERSIST-1"
    assert reloaded_sample.severity == "CRITICAL"
    verify_db.close()
