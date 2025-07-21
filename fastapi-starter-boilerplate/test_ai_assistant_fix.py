#!/usr/bin/env python3
"""
Test the fixed AI assistant text endpoint
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_ai_assistant_text():
    """Test the AI assistant text endpoint"""
    async with httpx.AsyncClient() as client:
        print("🤖 Testing Fixed AI Assistant Text Endpoint\n")
        
        # Test data
        test_text = "Hello, I need help with my crops"
        
        print(f"📤 Sending text: {test_text}")
        
        # Test the /ai-assistant/text endpoint
        response = await client.post(
            f"{BASE_URL}/ai-assistant/text",
            json={"text": test_text},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI Assistant SUCCESS:")
            print(f"   Reply: {result.get('reply')}")
        else:
            print("❌ AI Assistant FAILED:")
            try:
                error = response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Raw error: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_ai_assistant_text())
