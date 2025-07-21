from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from app.core.mongodb import get_database, USERS_COLLECTION, FARMERS_COLLECTION
from app.models.auth import User, Farmer, UserRole, FarmerOnboardingRequest
from app.utils.auth import create_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)

# Admin phone number (hardcoded)
ADMIN_PHONE_NUMBER = "9629321301"

class AuthService:
    def __init__(self):
        self.db = None

    def _get_db(self):
        if self.db is None:
            self.db = get_database()
        return self.db
    
    async def find_user_by_phone(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Find user by phone number"""
        try:
            db = self._get_db()
            user = await db[USERS_COLLECTION].find_one({"phone_number": phone_number})
            return user
        except Exception as e:
            logger.error(f"Error finding user by phone {phone_number}: {e}")
            return None
    
    async def create_user(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Create a new user with phone number"""
        try:
            db = self._get_db()
            user_data = {
                "phone_number": phone_number,
                "role": None,
                "is_onboarded": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            result = await db[USERS_COLLECTION].insert_one(user_data)

            if result.inserted_id:
                user_data["_id"] = result.inserted_id
                logger.info(f"Created new user with phone {phone_number}")
                return user_data
            return None

        except Exception as e:
            logger.error(f"Error creating user with phone {phone_number}: {e}")
            return None
    
    async def update_user_role(self, user_id: ObjectId, role: UserRole) -> bool:
        """Update user role"""
        try:
            db = self._get_db()
            result = await db[USERS_COLLECTION].update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "role": role.value,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating user role for {user_id}: {e}")
            return False
    
    async def mark_user_onboarded(self, user_id: ObjectId) -> bool:
        """Mark user as onboarded"""
        try:
            db = self._get_db()
            result = await db[USERS_COLLECTION].update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "is_onboarded": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking user as onboarded {user_id}: {e}")
            return False
    
    async def create_farmer_profile(self, user_id: ObjectId, phone_number: str, 
                                  farmer_data: FarmerOnboardingRequest) -> Optional[Dict[str, Any]]:
        """Create farmer profile"""
        try:
            farmer_doc = {
                "user_id": user_id,
                "phone_number": phone_number,
                "name": farmer_data.name,
                "age": farmer_data.age,
                "location": farmer_data.location,
                "farm_size": farmer_data.farm_size,
                "crops": farmer_data.crops,
                "experience_years": farmer_data.experience_years,
                "education_level": farmer_data.education_level,
                "annual_income": farmer_data.annual_income,
                "has_irrigation": farmer_data.has_irrigation,
                "farming_type": farmer_data.farming_type,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            db = self._get_db()
            result = await db[FARMERS_COLLECTION].insert_one(farmer_doc)
            
            if result.inserted_id:
                farmer_doc["_id"] = result.inserted_id
                logger.info(f"Created farmer profile for user {user_id}")
                return farmer_doc
            return None

        except Exception as e:
            logger.error(f"Error creating farmer profile for user {user_id}: {e}")
            return None

    async def create_farmer_profile_simple(self, user_id: ObjectId, phone_number: str,
                                         farmer_data: dict) -> Optional[Dict[str, Any]]:
        """Create farmer profile from simple dictionary data"""
        try:
            farmer_doc = {
                "user_id": user_id,
                "phone_number": phone_number,
                "name": farmer_data.get("name"),
                "age": farmer_data.get("age"),
                "location": farmer_data.get("location"),
                "farm_size": farmer_data.get("farm_size"),
                "crops": farmer_data.get("crops", []),
                "experience_years": farmer_data.get("experience_years"),
                "education_level": farmer_data.get("education_level"),
                "annual_income": farmer_data.get("annual_income"),
                "has_irrigation": farmer_data.get("has_irrigation", False),
                "farming_type": farmer_data.get("farming_type"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            db = self._get_db()
            result = await db[FARMERS_COLLECTION].insert_one(farmer_doc)

            if result.inserted_id:
                farmer_doc["_id"] = result.inserted_id
                logger.info(f"Created farmer profile for user {user_id}")
                return farmer_doc
            return None

        except Exception as e:
            logger.error(f"Error creating farmer profile for user {user_id}: {e}")
            return None
    
    async def get_farmer_by_user_id(self, user_id: ObjectId) -> Optional[Dict[str, Any]]:
        """Get farmer profile by user ID"""
        try:
            db = self._get_db()
            farmer = await db[FARMERS_COLLECTION].find_one({"user_id": user_id})
            return farmer
        except Exception as e:
            logger.error(f"Error getting farmer profile for user {user_id}: {e}")
            return None
    
    async def get_user_profile(self, user_id: ObjectId) -> Optional[Dict[str, Any]]:
        """Get complete user profile with farmer details if available"""
        try:
            db = self._get_db()
            user = await db[USERS_COLLECTION].find_one({"_id": user_id})
            if not user:
                return None
            
            profile = {
                "user_id": str(user["_id"]),
                "phone_number": user["phone_number"],
                "role": user.get("role"),
                "is_onboarded": user.get("is_onboarded", False),
                "created_at": user["created_at"],
                "farmer_details": None
            }
            
            # If user is a farmer and onboarded, get farmer details
            if user.get("role") == UserRole.FARMER.value and user.get("is_onboarded"):
                farmer = await self.get_farmer_by_user_id(user["_id"])
                if farmer:
                    # Remove sensitive/duplicate fields
                    farmer_details = {k: v for k, v in farmer.items() 
                                    if k not in ["_id", "user_id", "phone_number"]}
                    profile["farmer_details"] = farmer_details
            
            return profile
            
        except Exception as e:
            logger.error(f"Error getting user profile for {user_id}: {e}")
            return None

    def is_admin(self, phone_number: str) -> bool:
        """Check if user is admin based on phone number"""
        return phone_number == ADMIN_PHONE_NUMBER

    async def get_admin_profile(self, user_id: ObjectId) -> Optional[Dict[str, Any]]:
        """Get admin profile with special admin role"""
        try:
            db = self._get_db()
            user = await db[USERS_COLLECTION].find_one({"_id": user_id})
            if not user:
                return None

            # Check if user is admin
            if not self.is_admin(user["phone_number"]):
                return None

            profile = {
                "user_id": str(user["_id"]),
                "phone_number": user["phone_number"],
                "role": "admin",  # Special admin role
                "is_onboarded": True,  # Admin is always considered onboarded
                "is_admin": True,
                "created_at": user["created_at"],
                "admin_permissions": [
                    "manage_experts",
                    "view_all_users",
                    "manage_system"
                ]
            }

            return profile

        except Exception as e:
            logger.error(f"Error getting admin profile for {user_id}: {e}")
            return None

# Create service instance
auth_service = AuthService()
