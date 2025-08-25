from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import redis
from app.core.config import settings


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database = None


mongodb = MongoDB()

# Redis client for caching
_redis_client = None


async def connect_to_mongo():
    """Create database connection"""
    mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL)
    mongodb.database = mongodb.client[settings.DATABASE_NAME]
    print(f"Connected to MongoDB at {settings.MONGODB_URL}")


async def close_mongo_connection():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()
        print("Disconnected from MongoDB")


def get_database():
    """Get database instance"""
    return mongodb.database


def get_redis_client():
    """Get Redis client instance"""
    global _redis_client
    if _redis_client is None:
        try:
            # Parse Redis URL
            redis_url = settings.REDIS_URL
            _redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            _redis_client.ping()
            print(f"Connected to Redis at {redis_url}")
        except Exception as e:
            print(f"Failed to connect to Redis: {e}")
            _redis_client = None
    return _redis_client
