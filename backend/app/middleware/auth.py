from fastapi import HTTPException, status, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.services.auth_service import auth_service
from app.services.user_service import user_service
from app.models.user import User


security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify token
        payload = auth_service.verify_token(credentials.credentials)
        if payload is None:
            print(f"Token verification failed for token: {credentials.credentials[:20]}...")
            raise credentials_exception
        
        user_id: str = payload.get("sub")
        if user_id is None:
            print("No user ID in token payload")
            raise credentials_exception
            
        print(f"Token valid, user_id: {user_id}")
            
    except Exception as e:
        print(f"Token validation error: {e}")
        raise credentials_exception
    
    # Get user from database
    user = await user_service.get_user_by_id(user_id)
    if user is None:
        print(f"User not found in database for ID: {user_id}")
        raise credentials_exception
        
    print(f"User found: {user.phone_number}, is_phone_verified: {user.is_phone_verified}")
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    print(f"Checking if user is active: {current_user.phone_number}, is_phone_verified: {current_user.is_phone_verified}")
    if not current_user.is_phone_verified:
        print(f"User phone not verified: {current_user.phone_number}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Phone number not verified"
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_active_user)):
    """Require admin role"""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
