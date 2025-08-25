import redis
import json
import os

REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_DB = int(os.getenv('REDIS_DB', 0))

class RedisCache:
    def __init__(self, host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB):
        self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True)

    def set_user_data(self, user_id: str, data: dict, expire: int = 3600):
        key = f"user:{user_id}:data"
        self.client.set(key, json.dumps(data), ex=expire)

    def get_user_data(self, user_id: str) -> dict:
        key = f"user:{user_id}:data"
        val = self.client.get(key)
        return json.loads(val) if val else {}

    def set_weather_data(self, user_id: str, data: dict, expire: int = 1800):
        key = f"user:{user_id}:weather"
        self.client.set(key, json.dumps(data), ex=expire)

    def get_weather_data(self, user_id: str) -> dict:
        key = f"user:{user_id}:weather"
        val = self.client.get(key)
        return json.loads(val) if val else {}

    def clear_user_cache(self, user_id: str):
        self.client.delete(f"user:{user_id}:data")
        self.client.delete(f"user:{user_id}:weather")
