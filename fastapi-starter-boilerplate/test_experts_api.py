"""
Test script for Agricultural Experts API
"""

import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

async def test_experts_api():
    """Test the experts API endpoints"""
    
    print("🧪 Testing Agricultural Experts API")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        
        # Test 1: Get specializations list
        print("\n1️⃣ Testing GET /experts/specializations/list")
        try:
            response = await client.get(f"{BASE_URL}/experts/specializations/list")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {len(data['specializations'])} specializations")
                for spec in data['specializations'][:3]:  # Show first 3
                    print(f"   - {spec['label']} ({spec['value']})")
            else:
                print(f"❌ Error: {response.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 2: Get experts list (should be empty initially)
        print("\n2️⃣ Testing GET /experts/")
        try:
            response = await client.get(f"{BASE_URL}/experts/")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {data['total']} experts")
                print(f"   Page: {data['page']}, Per page: {data['per_page']}")
            else:
                print(f"❌ Error: {response.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 3: Search experts (should return empty)
        print("\n3️⃣ Testing GET /experts/search")
        try:
            response = await client.get(f"{BASE_URL}/experts/search?q=agriculture")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Search returned {data['total']} results for 'agriculture'")
            else:
                print(f"❌ Error: {response.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 4: Try to create expert without admin token (should fail)
        print("\n4️⃣ Testing POST /experts/ (without admin auth)")
        expert_data = {
            "name": "Dr. Rajesh Kumar",
            "email": "rajesh.kumar@agri.com",
            "phone": "9876543210",
            "specialization": ["crop_diseases", "soil_management"],
            "experience_years": 15,
            "qualification": "PhD in Plant Pathology",
            "location": "Chennai",
            "languages": ["Tamil", "English"],
            "bio": "Expert in crop disease management with 15 years of experience",
            "consultation_fee": 500.0,
            "availability_hours": "9 AM - 5 PM"
        }
        
        try:
            response = await client.post(
                f"{BASE_URL}/experts/",
                json=expert_data
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 401:
                print("✅ Correctly rejected unauthorized request")
            else:
                print(f"❌ Unexpected response: {response.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 5: Admin login to get token
        print("\n5️⃣ Testing Admin Login")
        try:
            login_response = await client.post(
                f"{BASE_URL}/auth/login",
                json={"phone_number": "9629321301"}
            )
            print(f"Login Status: {login_response.status_code}")
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                if login_data.get("is_admin"):
                    admin_token = login_data["access_token"]
                    print("✅ Admin login successful")
                    
                    # Test 6: Create expert with admin token
                    print("\n6️⃣ Testing POST /experts/ (with admin auth)")
                    headers = {"Authorization": f"Bearer {admin_token}"}
                    
                    response = await client.post(
                        f"{BASE_URL}/experts/",
                        json=expert_data,
                        headers=headers
                    )
                    print(f"Status: {response.status_code}")
                    
                    if response.status_code == 200:
                        created_expert = response.json()
                        expert_id = created_expert["id"]
                        print(f"✅ Expert created successfully with ID: {expert_id}")
                        print(f"   Name: {created_expert['name']}")
                        print(f"   Specialization: {created_expert['specialization']}")
                        
                        # Test 7: Get specific expert
                        print(f"\n7️⃣ Testing GET /experts/{expert_id}")
                        response = await client.get(f"{BASE_URL}/experts/{expert_id}")
                        print(f"Status: {response.status_code}")
                        
                        if response.status_code == 200:
                            expert = response.json()
                            print(f"✅ Retrieved expert: {expert['name']}")
                        else:
                            print(f"❌ Error: {response.text}")
                        
                        # Test 8: Update expert
                        print(f"\n8️⃣ Testing PUT /experts/{expert_id}")
                        update_data = {
                            "bio": "Updated bio: Expert in crop disease management with 15+ years of experience",
                            "consultation_fee": 600.0
                        }
                        
                        response = await client.put(
                            f"{BASE_URL}/experts/{expert_id}",
                            json=update_data,
                            headers=headers
                        )
                        print(f"Status: {response.status_code}")
                        
                        if response.status_code == 200:
                            updated_expert = response.json()
                            print(f"✅ Expert updated successfully")
                            print(f"   New fee: {updated_expert['consultation_fee']}")
                        else:
                            print(f"❌ Error: {response.text}")
                        
                        # Test 9: Search for the created expert
                        print(f"\n9️⃣ Testing search for created expert")
                        response = await client.get(f"{BASE_URL}/experts/search?q=Rajesh")
                        print(f"Status: {response.status_code}")
                        
                        if response.status_code == 200:
                            search_results = response.json()
                            print(f"✅ Search found {search_results['total']} experts")
                        else:
                            print(f"❌ Error: {response.text}")
                        
                        # Test 10: Delete expert (soft delete)
                        print(f"\n🔟 Testing DELETE /experts/{expert_id}")
                        response = await client.delete(
                            f"{BASE_URL}/experts/{expert_id}",
                            headers=headers
                        )
                        print(f"Status: {response.status_code}")
                        
                        if response.status_code == 200:
                            print("✅ Expert soft deleted successfully")
                        else:
                            print(f"❌ Error: {response.text}")
                    
                    else:
                        print(f"❌ Failed to create expert: {response.text}")
                else:
                    print("❌ Login successful but user is not admin")
            else:
                print(f"❌ Admin login failed: {login_response.text}")
        except Exception as e:
            print(f"❌ Exception during admin login: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Expert API testing completed!")

if __name__ == "__main__":
    asyncio.run(test_experts_api())
