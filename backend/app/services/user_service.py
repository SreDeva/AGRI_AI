from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_database
from app.models.user import User, OTPVerification
from app.schemas.auth import UserSignupRequest, UpdateProfileRequest
from app.services.twilio_service import twilio_service
from app.core.config import settings


class UserService:
    @property
    def db(self) -> AsyncIOMotorDatabase:
        return get_database()

    async def get_user_by_phone(self, phone_number: str) -> Optional[User]:
        """Get user by phone number"""
        user_data = await self.db.users.find_one({"phone_number": phone_number})
        if user_data:
            return User(**user_data)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        user_data = await self.db.users.find_one({"_id": ObjectId(user_id)})
        if user_data:
            return User(**user_data)
        return None

    async def create_user(self, user_data: UserSignupRequest) -> User:
        """Create a new user"""
        # Check if user already exists
        existing_user = await self.get_user_by_phone(user_data.phone_number)
        if existing_user:
            raise ValueError("User with this phone number already exists")

        # Create user object
        user = User(
            phone_number=user_data.phone_number,
            name=user_data.name,
            email=user_data.email,
            age=user_data.age,
            gender=user_data.gender,
            education_level=user_data.education_level,
            farm_name=user_data.farm_name,
            farm_size=user_data.farm_size,
            location=user_data.location,
            experience=user_data.experience,
            farm_type=user_data.farm_type,
            farm_ownership=user_data.farm_ownership,
            soil_type=user_data.soil_type,
            climate_zone=user_data.climate_zone,
            primary_crop=user_data.primary_crop,
            farming_method=user_data.farming_method,
            irrigation_type=user_data.irrigation_type,
            marketing_channel=user_data.marketing_channel,
            annual_income=user_data.annual_income,
            crops=user_data.crops or [],
            livestock=user_data.livestock or [],
            equipment=user_data.equipment or [],
            challenges=user_data.challenges or [],
            is_phone_verified=True,
            is_profile_complete=self._is_profile_complete(user_data),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Insert user into database
        result = await self.db.users.insert_one(user.dict(by_alias=True))
        user.id = result.inserted_id

        # Send welcome message
        await twilio_service.send_welcome_message(user.phone_number, user.name or "Farmer")

        return user

    async def update_user(self, user_id: str, update_data: UpdateProfileRequest) -> Optional[User]:
        """Update user profile"""
        update_dict = update_data.dict(exclude_unset=True)
        if not update_dict:
            return None

        update_dict["updated_at"] = datetime.utcnow()
        
        # Check if profile is complete after update
        user = await self.get_user_by_id(user_id)
        if user:
            # Merge the update data with existing user data to check completeness
            merged_data = user.dict()
            merged_data.update(update_dict)
            update_dict["is_profile_complete"] = self._is_profile_complete_dict(merged_data)

        await self.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_dict}
        )

        return await self.get_user_by_id(user_id)

    async def verify_phone_number(self, phone_number: str) -> bool:
        """Mark phone number as verified"""
        result = await self.db.users.update_one(
            {"phone_number": phone_number},
            {"$set": {"is_phone_verified": True, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    def _is_profile_complete(self, user_data: UserSignupRequest) -> bool:
        """Check if user profile is complete"""
        required_fields = [
            user_data.name,
            user_data.age,
            user_data.gender,
            user_data.location,
            user_data.farm_size,
            user_data.farm_type,
            user_data.primary_crop
        ]
        return all(field is not None for field in required_fields)

    def _is_profile_complete_dict(self, user_dict: dict) -> bool:
        """Check if user profile is complete from dict"""
        required_fields = [
            "name", "age", "gender", "location", 
            "farm_size", "farm_type", "primary_crop"
        ]
        return all(user_dict.get(field) is not None for field in required_fields)


class OTPService:
    @property
    def db(self) -> AsyncIOMotorDatabase:
        return get_database()

    async def create_otp(self, phone_number: str) -> OTPVerification:
        """Create a new OTP for phone number"""
        # Delete any existing OTP for this phone number
        await self.db.otps.delete_many({"phone_number": phone_number})

        # Generate new OTP
        otp_code = twilio_service.generate_otp(settings.OTP_LENGTH)
        expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        otp = OTPVerification(
            phone_number=phone_number,
            otp_code=otp_code,
            expires_at=expires_at,
            created_at=datetime.utcnow()
        )

        # Insert OTP into database
        result = await self.db.otps.insert_one(otp.dict(by_alias=True))
        otp.id = result.inserted_id

        # For development: print OTP to console instead of sending SMS
        print(f"🔐 OTP for {phone_number}: {otp_code} (expires in {settings.OTP_EXPIRE_MINUTES} minutes)")
        
        # Try to send OTP via SMS, but don't fail if it doesn't work
        try:
            sms_result = await twilio_service.send_otp(phone_number, otp_code)
            if sms_result["success"]:
                print(f"✅ SMS sent successfully to {phone_number}")
            else:
                print(f"⚠️  SMS failed: {sms_result['error']}, but OTP is available in console")
        except Exception as e:
            print(f"⚠️  SMS service unavailable: {str(e)}, but OTP is available in console")

        return otp

    async def verify_otp(self, phone_number: str, otp_code: str) -> bool:
        """Verify OTP for phone number"""
        # Find the OTP
        otp_data = await self.db.otps.find_one({
            "phone_number": phone_number,
            "otp_code": otp_code,
            "is_verified": False
        })

        if not otp_data:
            return False

        otp = OTPVerification(**otp_data)

        # Check if OTP has expired
        if datetime.utcnow() > otp.expires_at:
            await self.db.otps.delete_one({"_id": otp.id})
            return False

        # Check if max attempts exceeded
        if otp.attempts >= otp.max_attempts:
            await self.db.otps.delete_one({"_id": otp.id})
            return False

        # Mark OTP as verified
        await self.db.otps.update_one(
            {"_id": otp.id},
            {"$set": {"is_verified": True}}
        )

        return True

    async def increment_otp_attempts(self, phone_number: str, otp_code: str):
        """Increment OTP verification attempts"""
        await self.db.otps.update_one(
            {"phone_number": phone_number, "otp_code": otp_code},
            {"$inc": {"attempts": 1}}
        )

    async def cleanup_expired_otps(self):
        """Remove expired OTPs from database"""
        await self.db.otps.delete_many({
            "expires_at": {"$lt": datetime.utcnow()}
        })

    async def is_otp_recently_verified(self, phone_number: str, otp_code: str) -> bool:
        """Check if OTP was recently verified (within last 5 minutes)"""
        # Find a recently verified OTP
        recent_verification = await self.db.otps.find_one({
            "phone_number": phone_number,
            "otp_code": otp_code,
            "is_verified": True,
            "expires_at": {"$gt": datetime.utcnow() - timedelta(minutes=5)}
        })
        return recent_verification is not None


# Global instances
user_service = UserService()
otp_service = OTPService()
