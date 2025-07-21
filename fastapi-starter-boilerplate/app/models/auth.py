from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Annotated
from datetime import datetime
from bson import ObjectId
from enum import Enum

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class UserRole(str, Enum):
    FARMER = "farmer"
    HOBBYIST = "hobbyist"

# Login request model
class LoginRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=15)

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        # Remove any non-digit characters
        phone = ''.join(filter(str.isdigit, v))
        if len(phone) < 10:
            raise ValueError('Phone number must be at least 10 digits')
        return phone

# Login response model
class LoginResponse(BaseModel):
    success: bool
    message: str
    user_exists: bool
    redirect_to: str  # "roles", "onboarding", "home", or "admin_portal"
    access_token: Optional[str] = None
    user_id: Optional[str] = None
    user_role: Optional[UserRole] = None
    is_admin: Optional[bool] = False



# User model for database
class User(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    phone_number: str = Field(..., description="Unique phone number")
    role: Optional[UserRole] = None
    is_onboarded: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Farmer onboarding request model
class FarmerOnboardingRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=18, le=100)
    location: str = Field(..., min_length=2, max_length=200)
    farm_size: float = Field(..., gt=0, description="Farm size in acres")
    crops: List[str] = Field(..., min_items=1, description="List of crops grown")
    experience_years: int = Field(..., ge=0, le=80)
    education_level: str = Field(..., description="Education level")
    annual_income: Optional[float] = Field(None, ge=0, description="Annual income in local currency")
    has_irrigation: bool = Field(default=False)
    farming_type: str = Field(..., description="Organic, conventional, mixed, etc.")
    
    @field_validator('crops')
    @classmethod
    def validate_crops(cls, v):
        if not v:
            raise ValueError('At least one crop must be specified')
        return [crop.strip().lower() for crop in v if crop.strip()]

# Farmer model for database
class Farmer(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="Reference to User document")
    phone_number: str = Field(..., description="Phone number from user")
    name: str
    age: int
    location: str
    farm_size: float
    crops: List[str]
    experience_years: int
    education_level: str
    annual_income: Optional[float] = None
    has_irrigation: bool = False
    farming_type: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Response models
class FarmerOnboardingResponse(BaseModel):
    success: bool
    message: str
    farmer_id: Optional[str] = None
    access_token: Optional[str] = None
    redirect_to: str = "home"

class UserProfile(BaseModel):
    user_id: str
    phone_number: str
    role: UserRole
    is_onboarded: bool
    farmer_details: Optional[dict] = None

# Agricultural Expert models
class ExpertCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Expert's full name")
    experience: int = Field(..., ge=0, le=50, description="Years of experience")
    spoken_language: str = Field(..., min_length=2, max_length=50, description="Primary language")

class ExpertUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Expert's full name")
    experience: Optional[int] = Field(None, ge=0, le=50, description="Years of experience")
    spoken_language: Optional[str] = Field(None, min_length=2, max_length=50, description="Primary language")

class ExpertResponse(BaseModel):
    id: str
    name: str
    experience: int
    spoken_language: str

class ExpertListResponse(BaseModel):
    experts: List[ExpertResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
