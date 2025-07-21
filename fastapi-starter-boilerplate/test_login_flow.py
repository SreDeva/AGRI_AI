#!/usr/bin/env python3
"""
Test script to verify the login flow and token generation
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_new_user_login():
    """Test login flow for a new user"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing New User Login Flow\n")
        
        # Test phone number for new user
        test_phone = "9999888777"
        
        # Clean up any existing test data first
        print("🧹 Cleaning up existing test data...")
        try:
            # This would require admin access, so we'll skip for now
            pass
        except:
            pass
        
        print(f"📱 Testing login with new phone: {test_phone}")
        
        # Test login
        login_data = {"phone_number": test_phone}
        response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            login_response = response.json()
            print("✅ Login Response:")
            print(json.dumps(login_response, indent=2))
            
            # Check if access token is present
            if login_response.get("access_token"):
                print("✅ Access token generated for new user")
                
                # Test role selection with the token
                print("\n🔄 Testing role selection...")
                
                role_data = {"role": "farmer"}
                headers = {"Authorization": f"Bearer {login_response['access_token']}"}
                
                role_response = await client.post(
                    f"{BASE_URL}/auth/select-role", 
                    json=role_data, 
                    headers=headers
                )
                
                print(f"Role selection status: {role_response.status_code}")
                
                if role_response.status_code == 200:
                    role_result = role_response.json()
                    print("✅ Role Selection Response:")
                    print(json.dumps(role_result, indent=2))
                else:
                    print("❌ Role selection failed:")
                    print(role_response.text)
                    
            else:
                print("❌ No access token in login response")
                
        else:
            print("❌ Login failed:")
            print(response.text)

async def test_existing_user_login():
    """Test login flow for an existing user"""
    async with httpx.AsyncClient() as client:
        print("\n🧪 Testing Existing User Login Flow\n")
        
        # Use the same phone number as above (should now exist)
        test_phone = "9999888777"
        
        print(f"📱 Testing login with existing phone: {test_phone}")
        
        # Test login
        login_data = {"phone_number": test_phone}
        response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            login_response = response.json()
            print("✅ Existing User Login Response:")
            print(json.dumps(login_response, indent=2))
            
            # Check if access token is present
            if login_response.get("access_token"):
                print("✅ Access token present for existing user")
            else:
                print("❌ No access token for existing user")
                
        else:
            print("❌ Existing user login failed:")
            print(response.text)

if __name__ == "__main__":
    print("🚀 Starting Login Flow Tests...\n")
    print("Make sure the FastAPI server is running on http://localhost:8000\n")
    
    try:
        asyncio.run(test_new_user_login())
        asyncio.run(test_existing_user_login())
        print("\n🎉 All tests completed!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
