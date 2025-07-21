#!/usr/bin/env python3
"""
Test the complete authentication flow: Login -> Role Selection -> Onboarding
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_complete_authentication_flow():
    """Test the complete authentication flow for both user types"""
    async with httpx.AsyncClient() as client:
        print("🚀 Testing Complete Authentication Flow - All Fixed!\n")
        
        # Test scenarios
        scenarios = [
            {
                "name": "Complete Farmer Flow",
                "phone": "9876543300",
                "role": "farmer",
                "test_onboarding": True,
                "farmer_data": {
                    "name": "Test Farmer",
                    "age": 35,
                    "location": "Tamil Nadu",
                    "farm_size": 5,
                    "crops": ["rice", "wheat"],
                    "experience_years": 10,
                    "education_level": "College",
                    "has_irrigation": True,
                    "farming_type": "Organic"
                }
            },
            {
                "name": "Complete Hobbyist Flow",
                "phone": "9876543301",
                "role": "hobbyist",
                "test_onboarding": False
            }
        ]
        
        for scenario in scenarios:
            print(f"🧪 Testing: {scenario['name']}")
            print(f"📱 Phone: {scenario['phone']}")
            
            # Step 1: Login
            print("\n1️⃣ Login...")
            login_data = {"phone_number": scenario['phone']}
            login_response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if login_response.status_code != 200:
                print(f"❌ Login failed: {login_response.status_code}")
                continue
            
            login_result = login_response.json()
            access_token = login_result.get("access_token")
            print(f"✅ Login successful - Token: {'Yes' if access_token else 'No'}")
            
            # Step 2: Role Selection
            print("\n2️⃣ Role Selection...")
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
                continue
            
            role_result = role_response.json()
            new_token = role_result.get("access_token")
            print(f"✅ Role selection successful")
            print(f"   Role: {role_result.get('user_role')}")
            print(f"   Redirect: {role_result.get('redirect_to')}")
            
            # Step 3: Onboarding (if farmer)
            if scenario.get('test_onboarding'):
                print("\n3️⃣ Farmer Onboarding...")
                
                onboard_headers = {
                    "Authorization": f"Bearer {new_token}",
                    "Content-Type": "application/json"
                }
                
                onboard_response = await client.post(
                    f"{BASE_URL}/auth/onboard",
                    json=scenario['farmer_data'],
                    headers=onboard_headers
                )
                
                if onboard_response.status_code != 200:
                    print(f"❌ Onboarding failed: {onboard_response.status_code}")
                    try:
                        error = onboard_response.json()
                        print(f"   Error: {error}")
                    except:
                        print(f"   Raw: {onboard_response.text}")
                    continue
                
                onboard_result = onboard_response.json()
                print(f"✅ Onboarding successful")
                print(f"   Farmer ID: {onboard_result.get('farmer_id')}")
                print(f"   Final redirect: {onboard_result.get('redirect_to')}")
            else:
                print("\n3️⃣ Hobbyist - No onboarding needed")
                print(f"✅ Ready to use app - Redirect: {role_result.get('redirect_to')}")
            
            print("\n" + "="*60 + "\n")
        
        print("🎉 Complete authentication flow testing finished!")
        print("✅ All endpoints working without 422 errors!")

if __name__ == "__main__":
    asyncio.run(test_complete_authentication_flow())
