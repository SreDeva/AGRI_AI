#!/usr/bin/env python3
"""
Test the simplified role selection endpoint
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_simple_role_selection():
    """Test the simplified role selection"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing Simplified Role Selection\n")
        
        # Step 1: Login
        test_phone = "9876543210"
        print(f"📱 Login with phone {test_phone}")
        
        login_data = {"phone_number": test_phone}
        login_response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if login_response.status_code != 200:
            print("❌ Login failed")
            return
        
        login_result = login_response.json()
        access_token = login_result.get("access_token")
        
        if not access_token:
            print("❌ No access token")
            return
        
        print(f"✅ Got token: {access_token[:30]}...")
        
        # Step 2: Test role selection
        print(f"\n🔄 Testing role selection")
        
        role_data = {"role": "farmer"}
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        print(f"📤 Sending: {role_data}")
        print(f"📤 Headers: {headers}")
        
        role_response = await client.post(
            f"{BASE_URL}/auth/select-role", 
            json=role_data, 
            headers=headers
        )
        
        print(f"Status: {role_response.status_code}")
        
        if role_response.status_code == 200:
            result = role_response.json()
            print("✅ Success:")
            print(json.dumps(result, indent=2))
        else:
            print("❌ Failed:")
            try:
                error = role_response.json()
                print(json.dumps(error, indent=2))
            except:
                print(role_response.text)

if __name__ == "__main__":
    asyncio.run(test_simple_role_selection())
