"""
JalRakshak — ORM Model: NotificationLog

Records every email notification attempt:
- Which alert triggered it (water_sample.id)
- Which citizen/admin was targeted
- Delivery status, timestamp, language used
- Retry count for failed deliveries

This table is the audit trail for the email notification system.
It is owned by the backend and never exposed raw to citizens.
"""

from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
    func,
)

from app.database import Base


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # FK to water_samples.id (integer PK) — NOT a FK constraint to stay
    # compatible with SQLite and cross-DB deployments.
    alert_id = Column(Integer, nullable=False, index=True)

    # auth_user_id from user_profiles (UUID string from Supabase Auth)
    # NULL means this is an admin-broadcast notification (role = 'admin')
    citizen_id = Column(Integer, nullable=True, index=True)

    # Notification channel: 'EMAIL' (extensible to 'SMS', 'PUSH' later)
    channel = Column(String(32), nullable=False, default="EMAIL")

    # Actual recipient address
    recipient = Column(String(256), nullable=False)

    # Recipient role: 'citizen' | 'admin'
    recipient_role = Column(String(32), nullable=False, default="citizen")

    # ISO 639-1 language code used for the email body (e.g. 'en', 'hi', 'ta')
    language_code = Column(String(8), nullable=False, default="en")

    # Delivery status: 'SENT' | 'FAILED' | 'PENDING'
    status = Column(String(32), nullable=False, default="PENDING")

    # Human-readable failure reason (null on success)
    failure_reason = Column(Text, nullable=True)

    # Number of send attempts (starts at 1 after first try)
    attempt_count = Column(Integer, nullable=False, default=0)

    # Resend API message ID for tracking (null if not sent via Resend)
    provider_message_id = Column(String(256), nullable=True)

    # Citizen dashboard read/unread tracking
    is_read = Column(Boolean, nullable=False, default=False)

    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return (
            f"<NotificationLog "
            f"id={self.id} "
            f"alert_id={self.alert_id} "
            f"recipient={self.recipient!r} "
            f"status={self.status!r}>"
        )
