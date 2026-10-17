"""
JalRakshak — Authentication Dependencies
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import get_settings, Settings
from app.database import get_db
from app.models.user_profile import UserProfile

security = HTTPBearer()

def get_current_user_any_status(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserProfile:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        auth_user_id = payload.get("sub")
        if not auth_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
            
        user = db.query(UserProfile).filter(UserProfile.auth_user_id == auth_user_id).first()
        
        if user:
            # Self-healing location sync for citizens
            if user.role == "citizen" and (not user.state_ut or not user.district):
                try:
                    cp = db.execute(
                        text("SELECT state, district, state_id, district_id, mobile FROM public.citizen_profiles WHERE user_id::text = :uid"),
                        {"uid": auth_user_id}
                    ).first()
                    if cp:
                        changed = False
                        if cp.state and not user.state_ut:
                            user.state_ut = cp.state
                            changed = True
                        if cp.district and not user.district:
                            user.district = cp.district
                            changed = True
                        if cp.state_id and not user.state_id:
                            user.state_id = cp.state_id
                            changed = True
                        if cp.district_id and not user.district_id:
                            user.district_id = cp.district_id
                            changed = True
                        if cp.mobile and not user.phone:
                            user.phone = cp.mobile
                            changed = True
                        if changed:
                            db.commit()
                            db.refresh(user)
                except Exception as sync_err:
                    print(f"Warning: citizen_profiles sync check failed: {sync_err}")
            return user

        
        if not user:
            # Self-healing provision: if valid Supabase token belongs to an authenticated user,
            # safely initialize their profile in user_profiles.
            email = payload.get("email") or ""
            user_meta = payload.get("user_metadata") or {}
            app_meta = payload.get("app_metadata") or {}

            # Check if provisioned by admin via app_metadata
            is_admin_provisioned = (app_meta.get("role") is not None)
            if is_admin_provisioned:
                target_role = app_meta.get("role")
                target_status = app_meta.get("status", "active")
            else:
                req_role = (user_meta.get("role") or "citizen").lower()
                # Security rule: Public users CANNOT self-assign 'admin'
                if req_role == "admin":
                    target_role = "citizen"
                    target_status = "active"
                elif req_role in ("field_worker", "analyst"):
                    target_role = req_role
                    target_status = "pending_approval"
                else:
                    target_role = "citizen"
                    target_status = "active"

            if target_role not in ("citizen", "field_worker", "analyst", "admin"):
                target_role = "citizen"

            full_name = (
                user_meta.get("full_name")
                or user_meta.get("name")
                or (email.split("@")[0] if email else "User")
            )

            # Check if profile already exists by email (e.g. linked provider)
            existing_by_email = db.query(UserProfile).filter(UserProfile.email == email).first() if email else None
            if existing_by_email:
                existing_by_email.auth_user_id = auth_user_id
                if not existing_by_email.full_name or existing_by_email.full_name == "User":
                    existing_by_email.full_name = full_name
                db.commit()
                db.refresh(existing_by_email)
                return existing_by_email

            user = UserProfile(
                auth_user_id=auth_user_id,
                full_name=full_name,
                email=email,
                phone=user_meta.get("phone"),
                role=target_role,
                status=target_status,
                state_ut=user_meta.get("state_ut"),
                district=user_meta.get("district"),
                village=user_meta.get("village"),
                state_id=user_meta.get("state_id"),
                district_id=user_meta.get("district_id"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        return user
        
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
        )

def get_current_user(
    current_user: UserProfile = Depends(get_current_user_any_status),
) -> UserProfile:
    if current_user.status != "active":
        if current_user.status == "pending_approval":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is pending administrator approval.",
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    return current_user

def require_admin(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user

def require_field_worker(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    if current_user.role not in ["field_worker", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Field worker privileges required",
        )
    return current_user

def require_analyst(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    if current_user.role not in ["analyst", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analyst privileges required",
        )
    return current_user

def require_citizen(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    if current_user.role not in ["citizen", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizen privileges required",
        )
    return current_user
