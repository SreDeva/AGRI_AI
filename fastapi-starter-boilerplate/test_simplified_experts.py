"""
Test script for Simplified Agricultural Experts API
"""

import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

async def test_experts_api():
    """Test the simplified experts API endpoints"""
    
    print("🧪 Testing Simplified Agricultural Experts API")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        
        # Test 1: Get experts list (should be empty initially)
        print("\n1️⃣ Testing GET /experts/")
        try:
            response = await client.get(f"{BASE_URL}/experts/")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                experts = data.get("experts", [])
                print(f"✅ Found {len(experts)} experts")
                print(f"   Page: {data.get('page')}, Per page: {data.get('per_page')}")
            else:
                print(f"❌ Error: {response.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 2: Search experts
        print("\n2️⃣ Testing GET /experts/search")
        try:
            response = await client.get(f"{BASE_URL}/experts/search?q=agriculture")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Search returned {len(data.get('experts', []))} results for 'agriculture'")
            else:
                print(f"❌ Error: {response.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 3: Try to create expert without admin auth (should fail)
        print("\n3️⃣ Testing POST /experts/ (without admin auth)")
        expert_data = {
            "name": "Dr. Rajesh Kumar",
            "experience": 15,
            "spoken_language": "Tamil"
        }
        try:
            response = await client.post(f"{BASE_URL}/experts/", json=expert_data)
            print(f"Status: {response.status_code}")
            if response.status_code == 403:
                print("✅ Correctly rejected unauthenticated request")
            else:
                print(f"❌ Unexpected response: {response.json()}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 4: Admin login
        print("\n4️⃣ Testing Admin Login")
        login_data = {
            "phone_number": "9629321301",
            "password": "admin123"
        }
        try:
            response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
            print(f"Login Status: {response.status_code}")
            if response.status_code == 200:
                auth_data = response.json()
                token = auth_data.get("access_token")
                print("✅ Admin login successful")
                
                # Test 5: Create expert with admin auth
                print("\n5️⃣ Testing POST /experts/ (with admin auth)")
                headers = {"Authorization": f"Bearer {token}"}
                try:
                    response = await client.post(f"{BASE_URL}/experts/", json=expert_data, headers=headers)
                    print(f"Status: {response.status_code}")
                    if response.status_code == 200:
                        created_expert = response.json()
                        expert_id = created_expert.get("id")
                        print(f"✅ Expert created successfully with ID: {expert_id}")
                        print(f"   Name: {created_expert.get('name')}")
                        print(f"   Experience: {created_expert.get('experience')} years")
                        print(f"   Language: {created_expert.get('spoken_language')}")
                        
                        # Test 6: Get specific expert
                        print(f"\n6️⃣ Testing GET /experts/{expert_id}")
                        try:
                            response = await client.get(f"{BASE_URL}/experts/{expert_id}")
                            print(f"Status: {response.status_code}")
                            if response.status_code == 200:
                                expert = response.json()
                                print(f"✅ Retrieved expert: {expert.get('name')}")
                            else:
                                print(f"❌ Error: {response.text}")
                        except Exception as e:
                            print(f"❌ Exception: {e}")
                        
                        # Test 7: Update expert
                        print(f"\n7️⃣ Testing PUT /experts/{expert_id}")
                        update_data = {
                            "experience": 20,
                            "spoken_language": "Tamil, English"
                        }
                        try:
                            response = await client.put(f"{BASE_URL}/experts/{expert_id}", json=update_data, headers=headers)
                            print(f"Status: {response.status_code}")
                            if response.status_code == 200:
                                updated_expert = response.json()
                                print("✅ Expert updated successfully")
                                print(f"   New experience: {updated_expert.get('experience')} years")
                                print(f"   New language: {updated_expert.get('spoken_language')}")
                            else:
                                print(f"❌ Error: {response.text}")
                        except Exception as e:
                            print(f"❌ Exception: {e}")
                        
                        # Test 8: Search for created expert
                        print("\n8️⃣ Testing search for created expert")
                        try:
                            response = await client.get(f"{BASE_URL}/experts/search?q=Rajesh")
                            print(f"Status: {response.status_code}")
                            if response.status_code == 200:
                                data = response.json()
                                print(f"✅ Search found {len(data.get('experts', []))} experts")
                            else:
                                print(f"❌ Error: {response.text}")
                        except Exception as e:
                            print(f"❌ Exception: {e}")
                        
                        # Test 9: Delete expert (soft delete)
                        print(f"\n9️⃣ Testing DELETE /experts/{expert_id}")
                        try:
                            response = await client.delete(f"{BASE_URL}/experts/{expert_id}", headers=headers)
                            print(f"Status: {response.status_code}")
                            if response.status_code == 200:
                                print("✅ Expert soft deleted successfully")
                            else:
                                print(f"❌ Error: {response.text}")
                        except Exception as e:
                            print(f"❌ Exception: {e}")
                        
                    else:
                        print(f"❌ Failed to create expert: {response.json()}")
                except Exception as e:
                    print(f"❌ Exception: {e}")
            else:
                print(f"❌ Admin login failed: {response.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Simplified Expert API testing completed!")

if __name__ == "__main__":
    asyncio.run(test_experts_api())
