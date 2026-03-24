"""
Authentication Routes
Native register/login and session management
"""

from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from app.config import settings
from app.utils.auth import create_access_token, get_current_user, hash_password, verify_password
from app.services.redis_service import (
    store_session,
    delete_session,
    store_auth_user,
    get_auth_user,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


class RegisterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    session_token: str
    expires_in: int
    email: str


def normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if "@" not in normalized or "." not in normalized.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid email address"
        )
    return normalized


@router.post("/register", response_model=AuthResponse)
async def register_user(request: RegisterRequest):
    try:
        email = normalize_email(request.email)

        existing_user = get_auth_user(email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )

        password_hash = hash_password(request.password)
        store_auth_user(
            email,
            {
                "email": email,
                "username": email,
                "password_hash": password_hash,
                "created_at": str(datetime.utcnow())
            }
        )

        session_token = create_access_token(
            data={"username": email, "email": email},
            expires_delta=timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        )

        await store_session(
            session_token,
            {
                "username": email,
                "email": email,
                "auth_provider": "local",
                "created_at": str(datetime.utcnow())
            },
            ttl=settings.JWT_EXPIRATION_HOURS * 3600
        )

        return AuthResponse(
            session_token=session_token,
            expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
            email=email
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        logger.error(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=AuthResponse)
async def login_user(request: LoginRequest):
    try:
        email = normalize_email(request.email)
        auth_user = get_auth_user(email)

        if not auth_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(request.password, auth_user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        session_token = create_access_token(
            data={"username": email, "email": email},
            expires_delta=timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        )

        await store_session(
            session_token,
            {
                "username": email,
                "email": email,
                "auth_provider": "local",
                "created_at": str(datetime.utcnow())
            },
            ttl=settings.JWT_EXPIRATION_HOURS * 3600
        )

        return AuthResponse(
            session_token=session_token,
            expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
            email=email
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/logout")
async def logout(
    user: Annotated[dict, Depends(get_current_user)],
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """
    Logout user and invalidate session
    """
    try:
        await delete_session(credentials.credentials)
        logger.info(f"User logged out: {user['username']}")
        return {"message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.get("/me")
async def get_me(user: Annotated[dict, Depends(get_current_user)]):
    return {"email": user.get("email", user["username"])}
