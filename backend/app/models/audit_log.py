"""
JalRakshak — ORM Model: AuditLog

Stores application audit events for security and transparency.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    func,
)

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Supabase Auth user ID (who did it, if authenticated)
    auth_user_id = Column(String(128), nullable=True, index=True)
    
    # Internal user profile ID (if applicable)
    user_id = Column(Integer, nullable=True, index=True)
    
    # Action (e.g., LOGIN, SAMPLE_CREATED, WORKER_CREATED)
    action = Column(String(64), nullable=False, index=True)
    
    # Related entity type and ID
    entity_type = Column(String(64), nullable=True)
    entity_id = Column(String(128), nullable=True)
    
    # Extra JSON metadata stored as text
    metadata_json = Column(Text, nullable=True)
    
    timestamp = Column(DateTime, default=func.now(), nullable=False, index=True)

    def __repr__(self) -> str:
        return (
            f"<AuditLog "
            f"id={self.id} "
            f"action={self.action} "
            f"user_id={self.user_id}>"
        )
