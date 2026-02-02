"""
Redis Service
Manages Redis connections and operations
"""

import redis
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Redis client instance
redis_client = None


def get_redis_client():
    """Get or create Redis client"""
    global redis_client
    
    if redis_client is None:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
        )
    
    return redis_client


def check_redis_connection() -> bool:
    """
    Check if Redis connection is working
    Returns True if successful, False otherwise
    """
    try:
        client = get_redis_client()
        client.ping()
        logger.info("Redis connection successful")
        return True
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return False


# Session management functions
async def store_oauth_state(state: str, data: dict, ttl: int = 600):
    """Store OAuth state token with TTL"""
    client = get_redis_client()
    key = f"oauth:state:{state}"
    client.setex(key, ttl, str(data))


async def get_oauth_state(state: str):
    """Retrieve OAuth state token"""
    client = get_redis_client()
    key = f"oauth:state:{state}"
    return client.get(key)


async def delete_oauth_state(state: str):
    """Delete OAuth state token"""
    client = get_redis_client()
    key = f"oauth:state:{state}"
    client.delete(key)


async def store_session(session_token: str, data: dict, ttl: int = 3600):
    """Store session data with TTL"""
    client = get_redis_client()
    key = f"session:{session_token}"
    import json
    client.setex(key, ttl, json.dumps(data))


async def get_session(session_token: str):
    """Retrieve session data"""
    client = get_redis_client()
    key = f"session:{session_token}"
    data = client.get(key)
    if data:
        import json
        return json.loads(data)
    return None


async def delete_session(session_token: str):
    """Delete session"""
    client = get_redis_client()
    key = f"session:{session_token}"
    client.delete(key)
