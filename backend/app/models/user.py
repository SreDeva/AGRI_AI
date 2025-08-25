from datetime import datetime, timedelta
from typing import Optional, List, Annotated
from bson import ObjectId
from pydantic import BaseModel, Field, BeforeValidator
from enum import Enum


def validate_object_id(v):
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class GenderEnum(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"


class EducationLevelEnum(str, Enum):
    ELEMENTARY = "Elementary"
    HIGHER_SECONDARY = "Higher Secondary"
    GRADUATE = "Graduate"
    POST_GRADUATE = "Post Graduate"
    DIPLOMA = "Diploma"
    OTHERS = "Others"


class FarmTypeEnum(str, Enum):
    SMALL_SCALE = "Small Scale (0-2 acres)"
    MEDIUM_SCALE = "Medium Scale (2-10 acres)"
    LARGE_SCALE = "Large Scale (10+ acres)"


class FarmOwnershipEnum(str, Enum):
    OWN_LAND = "Own Land"
    RENTED = "Rented"
    SHARECROPPING = "Sharecropping"
    LEASED = "Leased"


class SoilTypeEnum(str, Enum):
    RED_SOIL = "Red Soil"
    BLACK_SOIL = "Black Soil"
    ALLUVIAL_SOIL = "Alluvial Soil"
    CLAY_SOIL = "Clay Soil"
    SANDY_SOIL = "Sandy Soil"
    LOAMY_SOIL = "Loamy Soil"


class ClimateZoneEnum(str, Enum):
    TROPICAL = "Tropical"
    SUBTROPICAL = "Subtropical"
    TEMPERATE = "Temperate"
    ARID = "Arid"
    SEMI_ARID = "Semi-Arid"


class FarmingMethodEnum(str, Enum):
    TRADITIONAL = "Traditional"
    ORGANIC = "Organic"
    INTEGRATED = "Integrated"
    PRECISION = "Precision"


class IrrigationTypeEnum(str, Enum):
    RAIN_FED = "Rain Fed"
    BORE_WELL = "Bore Well"
    CANAL = "Canal"
    DRIP = "Drip Irrigation"
    SPRINKLER = "Sprinkler"


class MarketingChannelEnum(str, Enum):
    LOCAL_MARKET = "Local Market"
    WHOLESALE = "Wholesale"
    DIRECT_CONSUMER = "Direct to Consumer"
    ONLINE = "Online Platform"
    COOPERATIVE = "Cooperative"
    MANDIS = "Mandis"


class RoleEnum(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class User(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    phone_number: str
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
    crops: Optional[List[str]] = []
    livestock: Optional[List[str]] = []
    equipment: Optional[List[str]] = []
    challenges: Optional[List[str]] = []
    is_phone_verified: bool = False
    is_profile_complete: bool = False
    role: RoleEnum = RoleEnum.USER
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class OTPVerification(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    phone_number: str
    otp_code: str
    expires_at: datetime
    is_verified: bool = False
    attempts: int = 0
    max_attempts: int = 3
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
