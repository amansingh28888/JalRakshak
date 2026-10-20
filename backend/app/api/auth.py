from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.models.user_profile import UserProfile
from app.api.deps.auth import get_current_user_any_status

router = APIRouter(prefix="/api/auth", tags=["auth"])

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    state_ut: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    state_id: Optional[str] = None
    district_id: Optional[str] = None
    preferred_language: Optional[str] = None

@router.get("/me")
def get_me(current_user: UserProfile = Depends(get_current_user_any_status)):
    """
    Returns the currently authenticated user's profile.
    This is used by the frontend to determine role and assignments.
    """
    return {
        "id": current_user.id,
        "auth_user_id": current_user.auth_user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "state_ut": current_user.state_ut,
        "district": current_user.district,
        "village": current_user.village,
        "state_id": current_user.state_id,
        "district_id": current_user.district_id,
        "status": current_user.status,
        "preferred_language": getattr(current_user, "preferred_language", "en") or "en",
    }

@router.put("/profile")
def update_profile(
    body: ProfileUpdateRequest,
    current_user: UserProfile = Depends(get_current_user_any_status),
    db: Session = Depends(get_db)
):
    """
    Authoritative profile update endpoint.
    Safely updates user location, details, and preferred language, propagating changes to citizen_profiles.
    """
    if body.full_name is not None and body.full_name.strip():
        current_user.full_name = body.full_name.strip()
    if body.phone is not None:
        current_user.phone = body.phone.strip()
    if body.state_ut is not None:
        current_user.state_ut = body.state_ut.strip()
    if body.district is not None:
        current_user.district = body.district.strip()
    if body.village is not None:
        current_user.village = body.village.strip()
    if body.state_id is not None:
        current_user.state_id = body.state_id.strip()
    if body.district_id is not None:
        current_user.district_id = body.district_id.strip()
    if body.preferred_language is not None and body.preferred_language.strip():
        current_user.preferred_language = body.preferred_language.strip().lower()

    db.commit()
    db.refresh(current_user)

    # Sync to citizen_profiles if role is citizen
    if current_user.role == "citizen":
        try:
            db.execute(text("""
                INSERT INTO public.citizen_profiles (
                    user_id, full_name, mobile, email, state, district, village, state_id, district_id, preferred_language
                )
                VALUES (
                    :uid, :name, :mobile, :email, :state, :district, :village, :state_id, :district_id, :preferred_language
                )
                ON CONFLICT (user_id) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    mobile = EXCLUDED.mobile,
                    state = EXCLUDED.state,
                    district = EXCLUDED.district,
                    village = EXCLUDED.village,
                    state_id = EXCLUDED.state_id,
                    district_id = EXCLUDED.district_id,
                    preferred_language = EXCLUDED.preferred_language
            """), {
                "uid": current_user.auth_user_id,
                "name": current_user.full_name,
                "mobile": current_user.phone or "",
                "email": current_user.email,
                "state": current_user.state_ut or "",
                "district": current_user.district or "",
                "village": current_user.village,
                "state_id": current_user.state_id,
                "district_id": current_user.district_id,
                "preferred_language": getattr(current_user, "preferred_language", "en") or "en",
            })
            db.commit()
        except Exception as e:
            print(f"Warning: citizen_profiles sync on update failed: {e}")

    return {
        "id": current_user.id,
        "auth_user_id": current_user.auth_user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "state_ut": current_user.state_ut,
        "district": current_user.district,
        "village": current_user.village,
        "state_id": current_user.state_id,
        "district_id": current_user.district_id,
        "status": current_user.status,
        "preferred_language": getattr(current_user, "preferred_language", "en") or "en",
    }

