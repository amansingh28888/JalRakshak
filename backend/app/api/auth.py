"""
JalRakshak — Auth API Router

Handles authentication-related endpoints like fetching the current user profile.
"""

from fastapi import APIRouter, Depends
from app.models.user_profile import UserProfile
from app.api.deps.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.get("/me")
def get_me(current_user: UserProfile = Depends(get_current_user)):
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
        "status": current_user.status,
    }
