#!/usr/bin/env python3
"""
Script to clear the experts collection for testing
"""
import asyncio
from app.core.mongodb import get_database, connect_to_mongo, close_mongo_connection

async def clear_experts():
    """Clear all experts from the database"""
    try:
        # Connect to MongoDB first
        await connect_to_mongo()

        db = get_database()
        result = await db.agricultural_experts.delete_many({})
        print(f"✅ Cleared {result.deleted_count} experts from the database")

        # Close connection
        await close_mongo_connection()
    except Exception as e:
        print(f"❌ Error clearing experts: {e}")

if __name__ == "__main__":
    asyncio.run(clear_experts())
