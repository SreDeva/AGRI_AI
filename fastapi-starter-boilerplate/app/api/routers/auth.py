from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import JSONResponse
from bson import ObjectId
import logging

from app.models.auth import (
    LoginRequest, LoginResponse, FarmerOnboardingRequest,
    UserRole, UserProfile
)
from app.services.auth_service import auth_service
from app.utils.auth import create_user_token, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """
    Login endpoint that checks if phone number exists in database.
    Returns appropriate redirect based on user status:
    - New user: redirect to roles page
    - Existing user without role: redirect to roles page  
    - Existing user with role but not onboarded: redirect to onboarding
    - Existing user with role and onboarded: redirect to home
    """
    try:
        phone_number = login_data.phone_number
        logger.info(f"Login attempt for phone: {phone_number}")
        
        # Check if user exists
        existing_user = await auth_service.find_user_by_phone(phone_number)
        
        if not existing_user:
            # Create new user
            new_user = await auth_service.create_user(phone_number)
            if not new_user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )
            
            # Generate access token for new user
            user_id = str(new_user["_id"])
            access_token = create_user_token(user_id, phone_number, None)

            return LoginResponse(
                success=True,
                message="New user created. Please select your role.",
                user_exists=False,
                redirect_to="roles",
                user_id=user_id,
                access_token=access_token
            )
        
        # User exists - check their status
        user_id = str(existing_user["_id"])
        user_role = existing_user.get("role")
        is_onboarded = existing_user.get("is_onboarded", False)

        # Check if user is admin (hardcoded phone number)
        is_admin = auth_service.is_admin(phone_number)

        # Generate access token for existing users
        access_token = create_user_token(user_id, phone_number, "admin" if is_admin else user_role)

        # Handle admin login
        if is_admin:
            logger.info(f"Admin login successful for phone: {phone_number}")
            return LoginResponse(
                success=True,
                message="Admin login successful. Welcome to admin portal!",
                user_exists=True,
                redirect_to="admin_portal",
                user_id=user_id,
                user_role=None,  # Admin doesn't have regular user role
                access_token=access_token,
                is_admin=True
            )
        
        # Determine redirect based on user status
        if not user_role:
            # User exists but no role selected
            return LoginResponse(
                success=True,
                message="Please select your role to continue.",
                user_exists=True,
                redirect_to="roles",
                user_id=user_id,
                access_token=access_token
            )
        
        elif user_role and not is_onboarded:
            # User has role but not onboarded
            if user_role == UserRole.FARMER.value:
                return LoginResponse(
                    success=True,
                    message="Please complete your farmer profile.",
                    user_exists=True,
                    redirect_to="onboarding",
                    user_id=user_id,
                    user_role=UserRole(user_role),
                    access_token=access_token
                )
            else:
                # For non-farmer roles, mark as onboarded and go to home
                await auth_service.mark_user_onboarded(ObjectId(user_id))
                return LoginResponse(
                    success=True,
                    message="Welcome back!",
                    user_exists=True,
                    redirect_to="home",
                    user_id=user_id,
                    user_role=UserRole(user_role),
                    access_token=access_token
                )
        
        else:
            # User is fully set up
            return LoginResponse(
                success=True,
                message="Welcome back!",
                user_exists=True,
                redirect_to="home",
                user_id=user_id,
                user_role=UserRole(user_role),
                access_token=access_token
            )
            
    except Exception as e:
        logger.error(f"Login error for phone {login_data.phone_number}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )

@router.post("/select-role")
async def select_role(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Simple role selection endpoint - accepts farmer or hobbyist
    """
    try:
        # Get raw request body and parse JSON manually
        body = await request.body()

        # Parse JSON manually to avoid Pydantic issues
        import json
        try:
            role_data = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON in request body"
            )

        # Extract role
        role_str = role_data.get("role")
        logger.info(f"Role selection - User: {current_user['user_id']}, Role: {role_str}")

        # Simple validation - only allow farmer or hobbyist
        if role_str not in ["farmer", "hobbyist"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be either 'farmer' or 'hobbyist'"
            )

        # Convert to enum
        role = UserRole.FARMER if role_str == "farmer" else UserRole.HOBBYIST
        user_id = current_user["user_id"]
        

        # Update user role in database
        success = await auth_service.update_user_role(ObjectId(user_id), role)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user role"
            )

        # Generate new token with role
        access_token = create_user_token(user_id, current_user["phone_number"], role.value)

        # Determine next step based on role
        if role == UserRole.FARMER:
            redirect_to = "onboarding"
            message = "Role updated. Please complete your farmer profile."
        else:
            redirect_to = "home"
            message = "Welcome! You're all set to explore."

        return {
            "success": True,
            "message": message,
            "redirect_to": redirect_to,
            "access_token": access_token,
            "user_role": role.value
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Role selection error for user {current_user.get('user_id')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update role. Please try again."
        )

@router.post("/onboard")
async def farmer_onboarding(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Simplified farmer onboarding endpoint - manual JSON parsing
    """
    try:
        # Get raw request body and parse JSON manually
        body = await request.body()

        # Parse JSON manually to avoid Pydantic issues
        import json
        try:
            farmer_data = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in onboarding: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON in request body"
            )

        user_id = current_user["user_id"]
        phone_number = current_user["phone_number"]
        user_role = current_user.get("role")

        # Verify user is a farmer
        if user_role != UserRole.FARMER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only farmers can access this endpoint"
            )

        logger.info(f"Farmer onboarding for user {user_id}")

        # Validate required fields manually
        required_fields = ["name", "age", "location", "farm_size", "crops", "experience_years"]
        for field in required_fields:
            if field not in farmer_data or farmer_data[field] is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )

        # Create farmer profile with manual data
        farmer_profile = await auth_service.create_farmer_profile_simple(
            ObjectId(user_id), phone_number, farmer_data
        )

        if not farmer_profile:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create farmer profile"
            )

        # Mark user as onboarded
        onboarded = await auth_service.mark_user_onboarded(ObjectId(user_id))

        if not onboarded:
            logger.warning(f"Failed to mark user {user_id} as onboarded")

        # Generate new access token
        access_token = create_user_token(user_id, phone_number, user_role)

        return {
            "success": True,
            "message": "Farmer profile created successfully. Welcome to the platform!",
            "farmer_id": str(farmer_profile["_id"]),
            "access_token": access_token,
            "redirect_to": "home"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Farmer onboarding error for user {current_user.get('user_id')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Onboarding failed. Please try again."
        )

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user profile with farmer details if available
    """
    try:
        user_id = current_user["user_id"]
        profile = await auth_service.get_user_profile(ObjectId(user_id))

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )

        return UserProfile(**profile)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get profile error for user {current_user.get('user_id')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )

@router.get("/admin/profile")
async def get_admin_profile(current_user: dict = Depends(get_current_user)):
    """
    Get admin profile - only accessible by admin phone number
    """
    try:
        user_id = current_user["user_id"]
        phone_number = current_user["phone_number"]

        logger.info(f"Admin profile request from user {user_id}, phone: {phone_number}")

        # Check if user is admin
        if not auth_service.is_admin(phone_number):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )

        profile = await auth_service.get_admin_profile(ObjectId(user_id))

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin profile not found"
            )

        return profile

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get admin profile error for user {current_user.get('user_id')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve admin profile"
        )
