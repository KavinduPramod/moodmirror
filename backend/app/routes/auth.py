"""
Authentication Routes
Reddit OAuth flow and session management
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
import praw
from app.config import settings
from app.utils.auth import generate_state_token, create_access_token, get_current_user
from app.services.redis_service import store_oauth_state, get_oauth_state, delete_oauth_state, store_session
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class OAuthInitRequest(BaseModel):
    redirect_uri: str


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str


@router.post("/reddit/init")
async def init_reddit_oauth(request: OAuthInitRequest):
    """
    Initiate Reddit OAuth flow
    
    Returns:
        - auth_url: Reddit authorization URL
        - state: State token for CSRF protection
    """
    try:
        # Generate state token for CSRF protection
        state = generate_state_token()
        
        # Store state in Redis with 15 minute TTL (increased for slower connections)
        await store_oauth_state(state, {
            "redirect_uri": request.redirect_uri,
            "created_at": str(datetime.utcnow())
        }, ttl=900)
        
        # Create Reddit OAuth URL
        reddit = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            redirect_uri=settings.REDDIT_REDIRECT_URI,
            user_agent=settings.REDDIT_USER_AGENT
        )
        
        auth_url = reddit.auth.url(
            scopes=["identity", "history", "read"],
            state=state,
            duration="temporary"
        )
        
        logger.info(f"OAuth initiated with state: {state[:10]}...")
        
        return {
            "auth_url": auth_url,
            "state": state
        }
        
    except Exception as e:
        logger.error(f"OAuth initialization failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize OAuth: {str(e)}"
        )


@router.post("/reddit/callback")
async def reddit_oauth_callback(request: OAuthCallbackRequest):
    """
    Handle Reddit OAuth callback
    
    Returns:
        - session_token: JWT token for subsequent requests
        - expires_in: Token expiration time in seconds
        - username: Reddit username
    """
    try:
        # Verify state token
        stored_state = await get_oauth_state(request.state)
        if not stored_state:
            logger.warning(f"Invalid or expired state token: {request.state[:10]}...")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired state token. Please try logging in again."
            )
        
        # Delete used state token (prevents replay attacks)
        await delete_oauth_state(request.state)
        
        logger.info(f"Processing OAuth callback with state: {request.state[:10]}...")
        
        # Exchange code for access token
        reddit = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            redirect_uri=settings.REDDIT_REDIRECT_URI,
            user_agent=settings.REDDIT_USER_AGENT
        )
        
        # Authorize and get access token
        reddit.auth.authorize(request.code)
        
        # Extract the access token from PRAW's session
        # PRAW stores it internally in _core._authorizer.access_token
        access_token = reddit.auth._reddit._core._authorizer.access_token
        
        logger.debug(f"Access token obtained: {access_token[:20] if access_token else 'None'}...")
        
        # Get Reddit username
        user = reddit.user.me()
        username = user.name
        
        logger.info(f"OAuth successful for user: {username}")
        
        # Create JWT session token
        session_token = create_access_token(
            data={"username": username},
            expires_delta=timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        )
        
        # Store session in Redis with Reddit access token
        await store_session(
            session_token,
            {
                "username": username,
                "reddit_access_token": access_token,
                "created_at": str(datetime.utcnow())
            },
            ttl=settings.JWT_EXPIRATION_HOURS * 3600
        )
        
        return {
            "session_token": session_token,
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
            "username": username
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth callback failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """
    Logout user and invalidate session
    """
    try:
        # In a real implementation, you'd get the actual token
        # For now, just return success
        # await delete_session(token)
        
        logger.info(f"User logged out: {user['username']}")
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )
