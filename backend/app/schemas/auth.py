from typing import Optional, List
from pydantic import BaseModel, validator
from app.models.user import (
    GenderEnum, EducationLevelEnum, FarmTypeEnum, FarmOwnershipEnum,
    SoilTypeEnum, ClimateZoneEnum, FarmingMethodEnum, IrrigationTypeEnum,
    MarketingChannelEnum
)


class SendOTPRequest(BaseModel):
    phone_number: str
    
    @validator('phone_number')
    def validate_phone_number(cls, v):
        # Remove spaces and special characters
        phone = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        
        # Check if it starts with + and has country code
        if not phone.startswith('+'):
            raise ValueError('Phone number must include country code starting with +')
        
        # Check if it's a valid length (minimum 10 digits after country code)
        if len(phone) < 10:
            raise ValueError('Phone number must be at least 10 digits long')
        
        return phone


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str
    
    @validator('phone_number')
    def validate_phone_number(cls, v):
        phone = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not phone.startswith('+'):
            raise ValueError('Phone number must include country code starting with +')
        if len(phone) < 10:
            raise ValueError('Phone number must be at least 10 digits long')
        return phone
    
    @validator('otp_code')
    def validate_otp_code(cls, v):
        if not v.isdigit():
            raise ValueError('OTP must contain only digits')
        if len(v) != 6:
            raise ValueError('OTP must be 6 digits long')
        return v


class UserSignupRequest(BaseModel):
    phone_number: str
    otp_code: str
    name: str
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[GenderEnum] = None
    education_level: Optional[EducationLevelEnum] = None
    farm_name: Optional[str] = None
    farm_size: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[int] = None
    farm_type: Optional[FarmTypeEnum] = None
    farm_ownership: Optional[FarmOwnershipEnum] = None
    soil_type: Optional[SoilTypeEnum] = None
    climate_zone: Optional[ClimateZoneEnum] = None
    primary_crop: Optional[str] = None
    farming_method: Optional[FarmingMethodEnum] = None
    irrigation_type: Optional[IrrigationTypeEnum] = None
    marketing_channel: Optional[MarketingChannelEnum] = None
    annual_income: Optional[str] = None
    crops: Optional[List[str]] = []
    livestock: Optional[List[str]] = []
    equipment: Optional[List[str]] = []
    challenges: Optional[List[str]] = []
    
    @validator('phone_number')
    def validate_phone_number(cls, v):
        phone = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not phone.startswith('+'):
            raise ValueError('Phone number must include country code starting with +')
        if len(phone) < 10:
            raise ValueError('Phone number must be at least 10 digits long')
        return phone
    
    @validator('otp_code')
    def validate_otp_code(cls, v):
        if not v.isdigit():
            raise ValueError('OTP must contain only digits')
        if len(v) != 6:
            raise ValueError('OTP must be 6 digits long')
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v
    
    @validator('age')
    def validate_age(cls, v):
        if v and (v < 18 or v > 100):
            raise ValueError('Age must be between 18 and 100')
        return v


class UserLoginRequest(BaseModel):
    phone_number: str
    otp_code: str
    
    @validator('phone_number')
    def validate_phone_number(cls, v):
        phone = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not phone.startswith('+'):
            raise ValueError('Phone number must include country code starting with +')
        if len(phone) < 10:
            raise ValueError('Phone number must be at least 10 digits long')
        return phone
    
    @validator('otp_code')
    def validate_otp_code(cls, v):
        if not v.isdigit():
            raise ValueError('OTP must contain only digits')
        if len(v) != 6:
            raise ValueError('OTP must be 6 digits long')
        return v


class UserResponse(BaseModel):
    id: str
    phone_number: str
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    education_level: Optional[str] = None
    farm_name: Optional[str] = None
    farm_size: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[int] = None
    farm_type: Optional[str] = None
    farm_ownership: Optional[str] = None
    soil_type: Optional[str] = None
    climate_zone: Optional[str] = None
    primary_crop: Optional[str] = None
    farming_method: Optional[str] = None
    irrigation_type: Optional[str] = None
    marketing_channel: Optional[str] = None
    annual_income: Optional[str] = None
    crops: Optional[List[str]] = []
    livestock: Optional[List[str]] = []
    equipment: Optional[List[str]] = []
    challenges: Optional[List[str]] = []
    is_phone_verified: bool
    is_profile_complete: bool
    role: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[GenderEnum] = None
    education_level: Optional[EducationLevelEnum] = None
    farm_name: Optional[str] = None
    farm_size: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[int] = None
    farm_type: Optional[FarmTypeEnum] = None
    farm_ownership: Optional[FarmOwnershipEnum] = None
    soil_type: Optional[SoilTypeEnum] = None
    climate_zone: Optional[ClimateZoneEnum] = None
    primary_crop: Optional[str] = None
    farming_method: Optional[FarmingMethodEnum] = None
    irrigation_type: Optional[IrrigationTypeEnum] = None
    marketing_channel: Optional[MarketingChannelEnum] = None
    annual_income: Optional[str] = None
    crops: Optional[List[str]] = None
    livestock: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    challenges: Optional[List[str]] = None
    
    @validator('email')
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v
    
    @validator('age')
    def validate_age(cls, v):
        if v and (v < 18 or v > 100):
            raise ValueError('Age must be between 18 and 100')
        return v
