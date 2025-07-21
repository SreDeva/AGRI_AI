#!/usr/bin/env python3
"""
Test the complete authentication flow: Login -> Role Selection -> Next Steps
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_complete_auth_flow():
    """Test the complete authentication flow"""
    async with httpx.AsyncClient() as client:
        print("🚀 Testing Complete Authentication Flow\n")
        
        # Test scenarios
        scenarios = [
            {
                "name": "New Farmer User",
                "phone": "9876543210",
                "role": "farmer",
                "expected_redirect": "onboarding"
            },
            {
                "name": "New Hobbyist User", 
                "phone": "9876543211",
                "role": "hobbyist",
                "expected_redirect": "home"
            }
        ]
        
        for scenario in scenarios:
            print(f"🧪 Testing: {scenario['name']}")
            print(f"📱 Phone: {scenario['phone']}")
            print(f"👤 Role: {scenario['role']}")
            
            # Step 1: Login
            print("\n1️⃣ Testing Login...")
            login_data = {"phone_number": scenario['phone']}
            login_response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if login_response.status_code != 200:
                print(f"❌ Login failed: {login_response.status_code}")
                print(login_response.text)
                continue
            
            login_result = login_response.json()
            print(f"✅ Login successful")
            print(f"   User exists: {login_result.get('user_exists')}")
            print(f"   Redirect to: {login_result.get('redirect_to')}")
            print(f"   Has token: {'Yes' if login_result.get('access_token') else 'No'}")
            
            access_token = login_result.get("access_token")
            if not access_token:
                print("❌ No access token received")
                continue
            
            # Step 2: Role Selection
            print("\n2️⃣ Testing Role Selection...")
            role_data = {"role": scenario['role']}
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
                try:
                    error = role_response.json()
                    print(f"   Error: {error}")
                except:
                    print(f"   Raw error: {role_response.text}")
                continue
            
            role_result = role_response.json()
            print(f"✅ Role selection successful")
            print(f"   Message: {role_result.get('message')}")
            print(f"   Redirect to: {role_result.get('redirect_to')}")
            print(f"   User role: {role_result.get('user_role')}")
            print(f"   New token: {'Yes' if role_result.get('access_token') else 'No'}")
            
            # Verify expected redirect
            if role_result.get('redirect_to') == scenario['expected_redirect']:
                print(f"✅ Correct redirect: {scenario['expected_redirect']}")
            else:
                print(f"❌ Wrong redirect. Expected: {scenario['expected_redirect']}, Got: {role_result.get('redirect_to')}")
            
            # Step 3: Test token validity (optional)
            print("\n3️⃣ Testing New Token...")
            new_token = role_result.get('access_token')
            if new_token:
                # Try to make another role selection with new token (should work)
                test_headers = {
                    "Authorization": f"Bearer {new_token}",
                    "Content-Type": "application/json"
                }
                
                # This should work since user already has a role
                test_response = await client.post(
                    f"{BASE_URL}/auth/select-role",
                    json={"role": scenario['role']},
                    headers=test_headers
                )
                
                if test_response.status_code == 200:
                    print("✅ New token is valid")
                else:
                    print(f"⚠️ New token test: {test_response.status_code}")
            
            print("\n" + "="*60 + "\n")
        
        print("🎉 Complete authentication flow testing finished!")

if __name__ == "__main__":
    asyncio.run(test_complete_auth_flow())
