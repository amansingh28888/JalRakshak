"""
JalRakshak — Admin API Router

Handles protected administrative operations such as worker management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)

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
                "email_confirm": True,
                "user_metadata": {
                    "full_name": worker_data.full_name,
                    "role": "field_worker"
                },
                "app_metadata": {
                    "role": "field_worker",
                    "status": "active"
                }
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
        
    # Check if handle_new_auth_user trigger already inserted a record
    existing = db.query(UserProfile).filter(UserProfile.auth_user_id == auth_user_id).first()
    if existing:
        existing.full_name = worker_data.full_name
        existing.email = worker_data.email
        existing.phone = worker_data.phone
        existing.role = "field_worker"
        existing.state_ut = worker_data.state_ut
        existing.district = worker_data.district
        existing.village = worker_data.village
        existing.status = "active"
        new_worker = existing
    else:
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

@router.delete("/workers/{worker_id}")
async def delete_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    """Permanently delete a field worker."""
    worker = db.query(UserProfile).filter(UserProfile.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    if worker.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete an administrator account")

    auth_id = worker.auth_user_id
    db.delete(worker)
    db.commit()

    if settings.supabase_url and settings.supabase_service_role_key and auth_id:
        try:
            async with httpx.AsyncClient() as client:
                await client.delete(
                    f"{settings.supabase_url}/auth/v1/admin/users/{auth_id}",
                    headers={
                        "apikey": settings.supabase_service_role_key,
                        "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    }
                )
        except Exception:
            pass

    return {"message": "Worker removed successfully"}

@router.patch("/workers/{worker_id}", response_model=WorkerResponse)
def update_worker_status(
    worker_id: int,
    status_data: WorkerStatusUpdate,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
):
    """Enable or disable a worker account, or approve a pending application."""
    worker = db.query(UserProfile).filter(UserProfile.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    if status_data.status not in ("active", "inactive", "pending_approval"):
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'active', 'pending_approval', or 'inactive'.")
        
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


class UserRoleUpdate(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None


class UserDetailResponse(BaseModel):
    id: int
    auth_user_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    status: str
    state_ut: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    state_id: Optional[str] = None
    district_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@router.get("/users", response_model=List[UserDetailResponse])
def list_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
):
    """List all registered application users with optional role or status filter."""
    q = db.query(UserProfile)
    if role:
        q = q.filter(UserProfile.role == role)
    if status:
        q = q.filter(UserProfile.status == status)
    return q.order_by(UserProfile.id.asc()).all()


@router.patch("/users/{user_id}/role", response_model=UserDetailResponse)
def update_user_role(
    user_id: int,
    update_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_admin),
):
    """Admin updates a user's role or approval status."""
    target_user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User profile not found")

    if update_data.role:
        if update_data.role not in ("citizen", "field_worker", "analyst", "admin"):
            raise HTTPException(status_code=400, detail="Invalid role specified")
        target_user.role = update_data.role

    if update_data.status:
        if update_data.status not in ("active", "pending_approval", "inactive"):
            raise HTTPException(status_code=400, detail="Invalid status specified")
        target_user.status = update_data.status

    db.commit()
    db.refresh(target_user)

    audit = AuditLog(
        auth_user_id=current_user.auth_user_id,
        user_id=current_user.id,
        action="USER_ROLE_UPDATED",
        entity_type="UserProfile",
        entity_id=str(target_user.id),
        metadata_json=f'{{"role": "{target_user.role}", "status": "{target_user.status}"}}'
    )
    db.add(audit)
    db.commit()

    return target_user
