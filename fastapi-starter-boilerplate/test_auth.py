#!/usr/bin/env python3
"""
Test script for authentication endpoints
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_login_flow():
    """Test the complete login and onboarding flow"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing Authentication Flow\n")
        
        # Test 1: Login with new phone number
        print("1. Testing login with new phone number...")
        login_data = {"phone_number": "9876543210"}
        
        response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}\n")
        
        if response.status_code == 200:
            login_response = response.json()
            user_id = login_response.get("user_id")
            
            if login_response.get("redirect_to") == "roles":
                print("2. Testing role selection...")
                
                # Test 2: Select farmer role
                role_data = {"role": "farmer"}
                headers = {"Authorization": f"Bearer {login_response.get('access_token', 'dummy-token')}"}
                
                response = await client.post(f"{BASE_URL}/auth/select-role", json=role_data, headers=headers)
                print(f"Status: {response.status_code}")
                print(f"Response: {response.json()}\n")
                
                if response.status_code == 200:
                    role_response = response.json()
                    
                    if role_response.get("redirect_to") == "onboarding":
                        print("3. Testing farmer onboarding...")
                        
                        # Test 3: Complete farmer onboarding
                        farmer_data = {
                            "name": "John Farmer",
                            "age": 35,
                            "location": "Tamil Nadu, India",
                            "farm_size": 5.5,
                            "crops": ["rice", "wheat", "tomato"],
                            "experience_years": 10,
                            "education_level": "High School",
                            "annual_income": 150000,
                            "has_irrigation": True,
                            "farming_type": "mixed"
                        }
                        
                        headers = {"Authorization": f"Bearer {role_response.get('access_token', 'dummy-token')}"}
                        response = await client.post(f"{BASE_URL}/auth/onboard", json=farmer_data, headers=headers)
                        print(f"Status: {response.status_code}")
                        print(f"Response: {response.json()}\n")
                        
                        if response.status_code == 200:
                            onboard_response = response.json()
                            
                            print("4. Testing user profile retrieval...")
                            headers = {"Authorization": f"Bearer {onboard_response.get('access_token', 'dummy-token')}"}
                            response = await client.get(f"{BASE_URL}/auth/profile", headers=headers)
                            print(f"Status: {response.status_code}")
                            print(f"Response: {json.dumps(response.json(), indent=2)}\n")
        
        # Test 5: Login with existing phone number
        print("5. Testing login with existing phone number...")
        response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}\n")

async def test_different_roles():
    """Test login flow with different roles"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing Different User Roles\n")
        
        # Test admin role
        print("Testing admin role...")
        login_data = {"phone_number": "9876543211"}
        
        response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            login_response = response.json()
            
            role_data = {"role": "admin"}
            headers = {"Authorization": f"Bearer {login_response.get('access_token', 'dummy-token')}"}
            
            response = await client.post(f"{BASE_URL}/auth/select-role", json=role_data, headers=headers)
            print(f"Admin role selection - Status: {response.status_code}")
            print(f"Response: {response.json()}\n")

if __name__ == "__main__":
    print("Starting authentication tests...")
    print("Make sure the FastAPI server is running on http://localhost:8000\n")
    
    try:
        asyncio.run(test_login_flow())
        asyncio.run(test_different_roles())
        print("✅ All tests completed!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
