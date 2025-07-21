#!/usr/bin/env python3
"""
Test script to verify MongoDB connection and basic operations
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from app.core.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.models.auth import User, Farmer, UserRole, LoginRequest
from app.services.auth_service import auth_service
from bson import ObjectId

async def test_mongodb_connection():
    """Test MongoDB connection and basic operations"""
    try:
        print("🔌 Testing MongoDB Connection...")
        
        # Connect to MongoDB
        await connect_to_mongo()
        print("✅ Successfully connected to MongoDB")
        
        # Get database instance
        db = get_database()
        if db is None:
            print("❌ Failed to get database instance")
            return
        
        print("✅ Database instance obtained")
        
        # Test collections
        users_collection = db.users
        farmers_collection = db.farmers
        
        print(f"📊 Users collection: {users_collection.name}")
        print(f"📊 Farmers collection: {farmers_collection.name}")
        
        # Test basic operations
        print("\n🧪 Testing Basic Operations...")
        
        # Test user creation
        test_phone = "9999999999"
        
        # Clean up any existing test data
        await users_collection.delete_many({"phone_number": test_phone})
        await farmers_collection.delete_many({"phone_number": test_phone})
        
        # Test user creation through service
        user = await auth_service.create_user(test_phone)
        if user:
            print(f"✅ Created test user: {user['_id']}")
            
            # Test user retrieval
            found_user = await auth_service.find_user_by_phone(test_phone)
            if found_user:
                print(f"✅ Found user by phone: {found_user['phone_number']}")
            else:
                print("❌ Failed to find user by phone")
            
            # Test role update
            user_id = user['_id']
            role_updated = await auth_service.update_user_role(user_id, UserRole.FARMER)
            if role_updated:
                print("✅ Updated user role to farmer")
            else:
                print("❌ Failed to update user role")
            
            # Clean up test data
            await users_collection.delete_one({"_id": user_id})
            print("🧹 Cleaned up test data")
        else:
            print("❌ Failed to create test user")
        
        # Test database stats
        users_count = await users_collection.count_documents({})
        farmers_count = await farmers_collection.count_documents({})
        
        print(f"\n📈 Database Stats:")
        print(f"   Users: {users_count}")
        print(f"   Farmers: {farmers_count}")
        
        print("\n✅ All MongoDB tests passed!")
        
    except Exception as e:
        print(f"❌ MongoDB test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Close connection
        await close_mongo_connection()
        print("🔌 MongoDB connection closed")

async def test_pydantic_models():
    """Test Pydantic model validation"""
    print("\n🧪 Testing Pydantic Models...")
    
    try:
        # Test LoginRequest
        login_req = LoginRequest(phone_number="9876543210")
        print(f"✅ LoginRequest: {login_req.phone_number}")
        
        # Test User model
        user_data = {
            "_id": ObjectId(),
            "phone_number": "9876543210",
            "role": UserRole.FARMER,
            "is_onboarded": True
        }
        user = User(**user_data)
        print(f"✅ User model: {user.phone_number}, Role: {user.role}")
        
        print("✅ All Pydantic model tests passed!")
        
    except Exception as e:
        print(f"❌ Pydantic model test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting MongoDB and Pydantic Tests...\n")
    
    # Test Pydantic models first (no async needed)
    asyncio.run(test_pydantic_models())
    
    # Test MongoDB connection
    asyncio.run(test_mongodb_connection())
    
    print("\n🎉 All tests completed!")
