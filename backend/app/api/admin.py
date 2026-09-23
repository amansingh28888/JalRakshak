"""
JalRakshak — Admin API Router

Handles protected administrative operations such as worker management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import httpx
import uuid

from app.database import get_db
from app.config import get_settings, Settings
from app.models.user_profile import UserProfile
from app.models.audit_log import AuditLog
from app.api.deps.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

class WorkerCreateRequest(BaseModel):
    full_name: str
    email: str
    password: str
    phone: Optional[str] = None
    state_ut: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None

class WorkerResponse(BaseModel):
    id: int
    auth_user_id: str
    full_name: str
    email: str
    phone: Optional[str]
    role: str
    state_ut: Optional[str]
    district: Optional[str]
    village: Optional[str]
    status: str

    class Config:
        from_attributes = True

class WorkerStatusUpdate(BaseModel):
    status: str  # 'active' or 'inactive'

@router.get("/workers", response_model=List[WorkerResponse])
def list_workers(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
):
    """List all workers."""
    workers = db.query(UserProfile).filter(UserProfile.role == "field_worker").all()
    return workers

@router.post("/workers", response_model=WorkerResponse)
async def create_worker(
    worker_data: WorkerCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    """
    Create a new field worker.
    Creates user in Supabase Auth via Admin API, then creates application profile.
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing on server."
        )
        
    # Create user in Supabase Auth
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.supabase_url}/auth/v1/admin/users",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": "application/json"
            },
            json={
                "email": worker_data.email,
                "password": worker_data.password,
                "email_confirm": True
            }
        )
        
        if response.status_code not in (200, 201):
            raise HTTPException(
                status_code=400,
                detail=f"Failed to create user in Supabase: {response.text}"
            )
            
        auth_user = response.json()
        auth_user_id = auth_user.get("id")

    if not auth_user_id:
        raise HTTPException(status_code=500, detail="Supabase user creation failed, no ID returned.")
        
    # Create user profile
    new_worker = UserProfile(
        auth_user_id=auth_user_id,
        full_name=worker_data.full_name,
        email=worker_data.email,
        phone=worker_data.phone,
        role="field_worker",
        state_ut=worker_data.state_ut,
        district=worker_data.district,
        village=worker_data.village,
        status="active"
    )
    
    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)
    
    # Audit Log
    audit = AuditLog(
        auth_user_id=current_user.auth_user_id,
        user_id=current_user.id,
        action="WORKER_CREATED",
        entity_type="UserProfile",
        entity_id=str(new_worker.id)
    )
    db.add(audit)
    db.commit()
    
    return new_worker

@router.patch("/workers/{worker_id}", response_model=WorkerResponse)
def update_worker_status(
    worker_id: int,
    status_data: WorkerStatusUpdate,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
):
    """Enable or disable a worker account."""
    worker = db.query(UserProfile).filter(UserProfile.id == worker_id, UserProfile.role == "field_worker").first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    if status_data.status not in ("active", "inactive"):
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'active' or 'inactive'.")
        
    worker.status = status_data.status
    db.commit()
    db.refresh(worker)
    
    # Audit Log
    audit = AuditLog(
        auth_user_id=current_user.auth_user_id,
        user_id=current_user.id,
        action="WORKER_STATUS_CHANGED",
        entity_type="UserProfile",
        entity_id=str(worker.id),
        metadata_json=f'{{"new_status": "{worker.status}"}}'
    )
    db.add(audit)
    db.commit()
    
    return worker

@router.get("/audit-logs")
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
    limit: int = 100
):
    """View recent audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    return logs
