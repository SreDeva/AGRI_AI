#!/usr/bin/env python3
"""
Test script to verify JWT token validation
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_token_validation():
    """Test the complete token flow"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing Token Validation Flow\n")
        
        # Step 1: Login to get a token
        test_phone = "9876543210"
        print(f"📱 Step 1: Login with phone {test_phone}")
        
        login_data = {"phone_number": test_phone}
        login_response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print("❌ Login failed:")
            print(login_response.text)
            return
        
        login_result = login_response.json()
        access_token = login_result.get("access_token")
        
        if not access_token:
            print("❌ No access token in login response")
            return
        
        print(f"✅ Got access token: {access_token[:50]}...")
        
        # Step 2: Test role selection with the token
        print(f"\n🔄 Step 2: Test role selection")
        
        role_data = {"role": "farmer"}
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        print(f"📤 Request headers: {headers}")
        print(f"📤 Request body: {role_data}")
        
        role_response = await client.post(
            f"{BASE_URL}/auth/select-role", 
            json=role_data, 
            headers=headers
        )
        
        print(f"Role selection status: {role_response.status_code}")
        
        if role_response.status_code == 200:
            role_result = role_response.json()
            print("✅ Role Selection Success:")
            print(json.dumps(role_result, indent=2))
        else:
            print("❌ Role selection failed:")
            print(f"Status: {role_response.status_code}")
            print(f"Response: {role_response.text}")
            
            # Try to parse error details
            try:
                error_json = role_response.json()
                print(f"Error details: {json.dumps(error_json, indent=2)}")
            except:
                pass

async def test_token_manually():
    """Test token validation with a manually created token"""
    from app.utils.auth import create_user_token, verify_token
    
    print("\n🧪 Testing Token Creation and Validation\n")
    
    # Create a token manually
    user_id = "test_user_123"
    phone_number = "9876543210"
    role = "farmer"
    
    token = create_user_token(user_id, phone_number, role)
    print(f"✅ Created token: {token[:50]}...")
    
    # Verify the token
    payload = verify_token(token)
    print(f"✅ Token payload: {payload}")
    
    if payload:
        print("✅ Token validation successful")
    else:
        print("❌ Token validation failed")

if __name__ == "__main__":
    print("🚀 Starting Token Validation Tests...\n")
    print("Make sure the FastAPI server is running on http://localhost:8000\n")
    
    try:
        asyncio.run(test_token_validation())
        asyncio.run(test_token_manually())
        print("\n🎉 All tests completed!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
