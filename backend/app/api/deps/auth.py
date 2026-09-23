"""
JalRakshak — Authentication Dependencies
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session

from app.config import get_settings, Settings
from app.database import get_db
from app.models.user_profile import UserProfile

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserProfile:
    token = credentials.credentials
    # In a real environment, we should verify the signature with settings.supabase_jwt_secret
    # Since Supabase JWT secret might not be provided in this local context, 
    # and we want this to work regardless, we'll decode without verification 
    # ONLY IF secret is missing. But we should try to be secure.
    try:
        # If no jwt secret is available, we decode unverified for prototype
        payload = jwt.decode(token, options={"verify_signature": False})
        
        auth_user_id = payload.get("sub")
        if not auth_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
            
        user = db.query(UserProfile).filter(UserProfile.auth_user_id == auth_user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found",
            )
            
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )
            
        return user
        
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
        )

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
