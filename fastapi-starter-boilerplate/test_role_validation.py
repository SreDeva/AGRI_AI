#!/usr/bin/env python3
"""
Test script to debug the role selection validation issue
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_role_validation_detailed():
    """Test role selection with detailed debugging"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing Role Selection Validation\n")
        
        # Step 1: Login to get a token
        test_phone = "9876543210"
        print(f"📱 Step 1: Login with phone {test_phone}")
        
        login_data = {"phone_number": test_phone}
        login_response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
        
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
        
        # Step 2: Test different role data formats
        test_cases = [
            {"name": "String role", "data": {"role": "farmer"}},
            {"name": "Raw string", "data": "farmer"},
            {"name": "Nested object", "data": {"role": {"value": "farmer"}}},
        ]
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        for test_case in test_cases:
            print(f"\n🔄 Testing: {test_case['name']}")
            print(f"📤 Sending data: {test_case['data']}")
            
            try:
                role_response = await client.post(
                    f"{BASE_URL}/auth/select-role", 
                    json=test_case['data'], 
                    headers=headers
                )
                
                print(f"Status: {role_response.status_code}")
                
                if role_response.status_code == 200:
                    role_result = role_response.json()
                    print("✅ Success:")
                    print(json.dumps(role_result, indent=2))
                    break  # Stop on first success
                else:
                    print("❌ Failed:")
                    try:
                        error_json = role_response.json()
                        print(json.dumps(error_json, indent=2))
                    except:
                        print(role_response.text)
                        
            except Exception as e:
                print(f"❌ Exception: {e}")

def test_pydantic_model_locally():
    """Test the Pydantic model validation locally"""
    print("\n🧪 Testing Pydantic Model Locally\n")
    
    try:
        from app.models.auth import RoleSelectionRequest, UserRole
        
        # Test valid data
        print("Testing valid role data:")
        
        test_data = {"role": "farmer"}
        print(f"Input: {test_data}")
        
        try:
            model = RoleSelectionRequest(**test_data)
            print(f"✅ Valid model: {model}")
            print(f"✅ Role value: {model.role}")
            print(f"✅ Role type: {type(model.role)}")
        except Exception as e:
            print(f"❌ Model validation failed: {e}")
            
        # Test direct enum
        print(f"\nTesting direct enum:")
        try:
            role_enum = UserRole("farmer")
            print(f"✅ Enum created: {role_enum}")
            print(f"✅ Enum value: {role_enum.value}")
        except Exception as e:
            print(f"❌ Enum creation failed: {e}")
            
        # Test model with enum
        print(f"\nTesting model with enum:")
        try:
            model_with_enum = RoleSelectionRequest(role=UserRole.FARMER)
            print(f"✅ Model with enum: {model_with_enum}")
        except Exception as e:
            print(f"❌ Model with enum failed: {e}")
            
    except ImportError as e:
        print(f"❌ Import failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting Role Validation Tests...\n")
    
    try:
        # Test Pydantic model locally first
        test_pydantic_model_locally()
        
        # Then test API
        print("\n" + "="*50)
        asyncio.run(test_role_validation_detailed())
        
        print("\n🎉 All tests completed!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
