"""
FastAPI Main Application
Entry point for MoodMirror backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import init_db, check_db_connection
from app.services.redis_service import check_redis_connection
from app.routes import auth
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="MoodMirror API",
    description="Mental Health Risk Assessment Platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENV,
        "version": "1.0.0"
    }


# Configuration endpoint for frontend
@app.get("/config")
async def get_frontend_config():
    """
    Serve frontend configuration
    Only exposes safe, public values
    """
    return {
        "appName": settings.FRONTEND_APP_NAME,
        "appVersion": settings.FRONTEND_APP_VERSION,
        "enableEmailReport": settings.FRONTEND_ENABLE_EMAIL_REPORT,
        "enableAnalytics": settings.FRONTEND_ENABLE_ANALYTICS,
        "redditClientId": settings.REDDIT_CLIENT_ID,
        "redirectUri": settings.REDDIT_REDIRECT_URI,
        "apiBaseUrl": f"http://{settings.API_HOST}:{settings.API_PORT}",
    }


# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info(f"Starting MoodMirror API in {settings.ENV} mode")
    logger.info(f"CORS origins: {settings.cors_origins_list}")
    
    # Check Redis connection
    try:
        if check_redis_connection():
            logger.info("Redis connected successfully")
        else:
            logger.error("Failed to connect to Redis")
    except Exception as e:
        logger.error(f"Redis connection error: {e}")
    
    # Initialize database
    try:
        if check_db_connection():
            logger.info("Database connection verified")
            init_db()
            logger.info("Database initialized successfully")
        else:
            logger.error("Failed to connect to database")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down MoodMirror API")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
