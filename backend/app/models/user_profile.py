"""
JalRakshak — ORM Model: UserProfile

Stores application-level user profiles for authorization and assignments.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    func,
)

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Supabase Auth user ID
    auth_user_id = Column(String(128), unique=True, nullable=False, index=True)
    
    full_name = Column(String(128), nullable=False)
    email = Column(String(256), nullable=False, unique=True, index=True)
    phone = Column(String(32), nullable=True)
    
    # role: 'admin' | 'field_worker'
    role = Column(String(32), nullable=False, default="field_worker")
    
    # Assignments (for field workers)
    state_ut = Column(String(128), nullable=True)
    district = Column(String(128), nullable=True)
    village = Column(String(256), nullable=True)
    
    # status: 'active' | 'inactive'
    status = Column(String(32), nullable=False, default="active")
    
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return (
            f"<UserProfile "
            f"id={self.id} "
            f"role={self.role} "
            f"email={self.email!r}>"
        )
