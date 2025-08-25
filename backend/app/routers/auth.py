from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse

from app.schemas.auth import (
    SendOTPRequest, VerifyOTPRequest, UserSignupRequest, UserLoginRequest,
    AuthResponse, MessageResponse, UserResponse, UpdateProfileRequest
)
from app.services.user_service import user_service, otp_service
from app.services.auth_service import auth_service
from app.middleware.auth import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp", response_model=MessageResponse)
async def send_otp(request: SendOTPRequest):
    """Send OTP to phone number"""
    try:
        # Create and send OTP
        otp = await otp_service.create_otp(request.phone_number)
        
        return MessageResponse(
            message=f"OTP sent successfully to {request.phone_number}",
            success=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}"
        )


@router.post("/verify-otp", response_model=MessageResponse)
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP for phone number"""
    try:
        # Increment attempts first
        await otp_service.increment_otp_attempts(request.phone_number, request.otp_code)
        
        # Verify OTP
        is_valid = await otp_service.verify_otp(request.phone_number, request.otp_code)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        return MessageResponse(
            message="OTP verified successfully",
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify OTP: {str(e)}"
        )


@router.post("/signup", response_model=AuthResponse)
async def signup(request: UserSignupRequest):
    """User signup with phone verification"""
    try:
        # Check if OTP was recently verified OR verify it now
        is_recently_verified = await otp_service.is_otp_recently_verified(request.phone_number, request.otp_code)
        
        if not is_recently_verified:
            # Try to verify OTP if not recently verified
            is_valid = await otp_service.verify_otp(request.phone_number, request.otp_code)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired OTP"
                )
        
        # Check if user already exists
        existing_user = await user_service.get_user_by_phone(request.phone_number)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this phone number already exists"
            )
        
        # Create user
        user = await user_service.create_user(request)
        print(f"User created: {user.id}, is_phone_verified: {user.is_phone_verified}")
        
        # Create access token
        access_token = auth_service.create_access_token(data={"sub": str(user.id)})
        print(f"Access token created: {access_token[:20]}...")
        
        # Prepare user response
        user_response = UserResponse(
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
        
        return AuthResponse(
            access_token=access_token,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: UserLoginRequest):
    """User login with phone verification"""
    try:
        # Check if OTP was recently verified OR verify it now
        is_recently_verified = await otp_service.is_otp_recently_verified(request.phone_number, request.otp_code)
        
        if not is_recently_verified:
            # Try to verify OTP if not recently verified
            is_valid = await otp_service.verify_otp(request.phone_number, request.otp_code)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired OTP"
                )
        
        # Get user
        user = await user_service.get_user_by_phone(request.phone_number)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please sign up first."
            )
        
        # Mark phone as verified (in case it wasn't)
        await user_service.verify_phone_number(request.phone_number)
        
        # Create access token
        access_token = auth_service.create_access_token(data={"sub": str(user.id)})
        
        # Prepare user response
        user_response = UserResponse(
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
        
        return AuthResponse(
            access_token=access_token,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to login: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
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


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Update user profile"""
    try:
        # Update user
        updated_user = await user_service.update_user(str(current_user.id), request)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes were made"
            )
        
        return UserResponse(
            id=str(updated_user.id),
            phone_number=updated_user.phone_number,
            name=updated_user.name,
            email=updated_user.email,
            age=updated_user.age,
            gender=updated_user.gender,
            education_level=updated_user.education_level,
            farm_name=updated_user.farm_name,
            farm_size=updated_user.farm_size,
            location=updated_user.location,
            experience=updated_user.experience,
            farm_type=updated_user.farm_type,
            farm_ownership=updated_user.farm_ownership,
            soil_type=updated_user.soil_type,
            climate_zone=updated_user.climate_zone,
            primary_crop=updated_user.primary_crop,
            farming_method=updated_user.farming_method,
            irrigation_type=updated_user.irrigation_type,
            marketing_channel=updated_user.marketing_channel,
            annual_income=updated_user.annual_income,
            crops=updated_user.crops,
            livestock=updated_user.livestock,
            equipment=updated_user.equipment,
            challenges=updated_user.challenges,
            is_phone_verified=updated_user.is_phone_verified,
            is_profile_complete=updated_user.is_profile_complete,
            role=updated_user.role
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.post("/refresh-token", response_model=AuthResponse)
async def refresh_token(current_user: User = Depends(get_current_active_user)):
    """Refresh access token"""
    try:
        # Create new access token
        access_token = auth_service.create_access_token(data={"sub": str(current_user.id)})
        
        # Prepare user response
        user_response = UserResponse(
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
        
        return AuthResponse(
            access_token=access_token,
            user=user_response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh token: {str(e)}"
        )
