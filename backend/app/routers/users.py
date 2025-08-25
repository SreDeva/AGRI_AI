from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from app.schemas.auth import UserResponse
from app.middleware.auth import get_current_active_user, require_admin
from app.services.user_service import user_service
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user's profile"""
    return UserResponse(
        id=str(current_user.id),
        phone_number=current_user.phone_number,
        name=current_user.name,
        email=current_user.email,
        age=current_user.age,
        gender=current_user.gender,
        education_level=current_user.education_level,
        farm_name=current_user.farm_name,
        farm_size=current_user.farm_size,
        location=current_user.location,
        experience=current_user.experience,
        farm_type=current_user.farm_type,
        farm_ownership=current_user.farm_ownership,
        soil_type=current_user.soil_type,
        climate_zone=current_user.climate_zone,
        primary_crop=current_user.primary_crop,
        farming_method=current_user.farming_method,
        irrigation_type=current_user.irrigation_type,
        marketing_channel=current_user.marketing_channel,
        annual_income=current_user.annual_income,
        crops=current_user.crops,
        livestock=current_user.livestock,
        equipment=current_user.equipment,
        challenges=current_user.challenges,
        is_phone_verified=current_user.is_phone_verified,
        is_profile_complete=current_user.is_profile_complete,
        role=current_user.role
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: User = Depends(require_admin)
):
    """Get user by ID (Admin only)"""
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user.id),
        phone_number=user.phone_number,
        name=user.name,
        email=user.email,
        age=user.age,
        gender=user.gender,
        education_level=user.education_level,
        farm_name=user.farm_name,
        farm_size=user.farm_size,
        location=user.location,
        experience=user.experience,
        farm_type=user.farm_type,
        farm_ownership=user.farm_ownership,
        soil_type=user.soil_type,
        climate_zone=user.climate_zone,
        primary_crop=user.primary_crop,
        farming_method=user.farming_method,
        irrigation_type=user.irrigation_type,
        marketing_channel=user.marketing_channel,
        annual_income=user.annual_income,
        crops=user.crops,
        livestock=user.livestock,
        equipment=user.equipment,
        challenges=user.challenges,
        is_phone_verified=user.is_phone_verified,
        is_profile_complete=user.is_profile_complete,
        role=user.role
    )
