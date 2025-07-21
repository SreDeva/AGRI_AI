#!/usr/bin/env python3
"""
Script to reset the experts collection indexes
"""
import asyncio
from app.core.mongodb import get_database, connect_to_mongo, close_mongo_connection

async def reset_indexes():
    """Reset all indexes for the experts collection"""
    try:
        # Connect to MongoDB first
        await connect_to_mongo()
        
        db = get_database()
        
        # Drop all indexes except _id
        await db.agricultural_experts.drop_indexes()
        print("✅ Dropped all indexes")
        
        # Close connection
        await close_mongo_connection()
    except Exception as e:
        print(f"❌ Error resetting indexes: {e}")

if __name__ == "__main__":
    asyncio.run(reset_indexes())
