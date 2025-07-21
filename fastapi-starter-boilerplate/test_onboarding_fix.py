#!/usr/bin/env python3
"""
Test the fixed farmer onboarding endpoint
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_farmer_onboarding():
    """Test the complete farmer onboarding flow"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing Fixed Farmer Onboarding\n")
        
        # Step 1: Login as new user
        test_phone = "9876543299"
        print(f"📱 Step 1: Login with phone {test_phone}")
        
        login_data = {"phone_number": test_phone}
        login_response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return
        
        login_result = login_response.json()
        access_token = login_result.get("access_token")
        
        if not access_token:
            print("❌ No access token from login")
            return
        
        print(f"✅ Login successful, got token")
        
        # Step 2: Select farmer role
        print(f"\n🔄 Step 2: Select farmer role")
        
        role_data = {"role": "farmer"}
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        role_response = await client.post(
            f"{BASE_URL}/auth/select-role", 
            json=role_data, 
            headers=headers
        )
        
        if role_response.status_code != 200:
            print(f"❌ Role selection failed: {role_response.status_code}")
            return
        
        role_result = role_response.json()
        new_token = role_result.get("access_token")
        
        if not new_token:
            print("❌ No new token from role selection")
            return
        
        print(f"✅ Role selection successful")
        print(f"   Redirect to: {role_result.get('redirect_to')}")
        
        # Step 3: Test farmer onboarding
        print(f"\n👨‍🌾 Step 3: Farmer onboarding")
        
        farmer_data = {
            "name": "Deva",
            "age": 34,
            "location": "Chennai",
            "farm_size": 3,
            "crops": ["rice"],
            "experience_years": 5,
            "education_level": "High school",
            "has_irrigation": False,
            "farming_type": "Mixed"
        }
        
        onboard_headers = {
            "Authorization": f"Bearer {new_token}",
            "Content-Type": "application/json"
        }
        
        print(f"📤 Sending farmer data: {farmer_data}")
        
        onboard_response = await client.post(
            f"{BASE_URL}/auth/onboard",
            json=farmer_data,
            headers=onboard_headers
        )
        
        print(f"Status: {onboard_response.status_code}")
        
        if onboard_response.status_code == 200:
            onboard_result = onboard_response.json()
            print("✅ Farmer onboarding SUCCESS:")
            print(f"   Message: {onboard_result.get('message')}")
            print(f"   Farmer ID: {onboard_result.get('farmer_id')}")
            print(f"   Redirect to: {onboard_result.get('redirect_to')}")
            print(f"   New token: {'Yes' if onboard_result.get('access_token') else 'No'}")
        else:
            print("❌ Farmer onboarding FAILED:")
            try:
                error = onboard_response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Raw error: {onboard_response.text}")

if __name__ == "__main__":
    asyncio.run(test_farmer_onboarding())
