#!/usr/bin/env python3
"""
Test the final simplified role selection endpoint
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_both_roles():
    """Test both farmer and hobbyist roles"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing Simplified Role Selection - Both Roles\n")
        
        roles_to_test = ["farmer", "hobbyist"]
        
        for role in roles_to_test:
            print(f"🔄 Testing role: {role}")
            
            # Step 1: Login
            test_phone = f"987654321{len(role)}"  # Different phone for each test
            print(f"📱 Login with phone {test_phone}")
            
            login_data = {"phone_number": test_phone}
            login_response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if login_response.status_code != 200:
                print(f"❌ Login failed for {role}")
                continue
            
            login_result = login_response.json()
            access_token = login_result.get("access_token")
            
            if not access_token:
                print(f"❌ No access token for {role}")
                continue
            
            print(f"✅ Got token for {role}")
            
            # Step 2: Test role selection
            role_data = {"role": role}
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            print(f"📤 Sending: {role_data}")
            
            role_response = await client.post(
                f"{BASE_URL}/auth/select-role", 
                json=role_data, 
                headers=headers
            )
            
            print(f"Status: {role_response.status_code}")
            
            if role_response.status_code == 200:
                result = role_response.json()
                print(f"✅ {role.title()} role selection SUCCESS:")
                print(f"   Message: {result.get('message')}")
                print(f"   Redirect: {result.get('redirect_to')}")
                print(f"   User Role: {result.get('user_role')}")
            else:
                print(f"❌ {role.title()} role selection FAILED:")
                try:
                    error = role_response.json()
                    print(f"   Error: {error}")
                except:
                    print(f"   Raw error: {role_response.text}")
            
            print("-" * 50)

if __name__ == "__main__":
    asyncio.run(test_both_roles())
