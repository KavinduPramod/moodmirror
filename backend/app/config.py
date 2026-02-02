"""
Configuration Management
Loads environment variables and application settings
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Environment
    ENV: str = "development"
    DEBUG: bool = True
    RELOAD: bool = True  # Hot reload for development
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Reddit API
    REDDIT_CLIENT_ID: str
    REDDIT_CLIENT_SECRET: str
    REDDIT_REDIRECT_URI: str
    REDDIT_USER_AGENT: str = "MoodMirror/1.0"
    
    # Database - MariaDB (separate credentials)
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME_DEV: str = "moodmirror_dev"
    DB_NAME_PROD: str = "moodmirror"
    
    @property
    def DATABASE_URL(self) -> str:
        """Build database URL based on environment"""
        db_name = self.DB_NAME_PROD if self.ENV == "production" else self.DB_NAME_DEV
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{db_name}"
    
    # Redis
    REDIS_URL: str = "redis://:password@localhost:6379/0"
    REDIS_PASSWORD: str = ""
    
    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 1
    ENCRYPTION_KEY: str
    
    # Email (optional)
    RESEND_API_KEY: str = ""
    
    # Model
    MODEL_PATH: str = "../model/moodmirror_model.pt"
    
    # Rate Limiting
    RATE_LIMIT_PER_DAY: int = 100
    RATE_LIMIT_ANALYZE_PER_DAY: int = 10
    RATE_LIMIT_AUTH_PER_HOUR: int = 20
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    CORS_ALLOW_CREDENTIALS: bool = True
    
    # Logging
    LOG_LEVEL: str = "DEBUG"
    LOG_FORMAT: str = "json"
    
    # Frontend Configuration (served via API)
    FRONTEND_APP_NAME: str = "MoodMirror"
    FRONTEND_APP_VERSION: str = "1.0.0"
    FRONTEND_ENABLE_EMAIL_REPORT: bool = True
    FRONTEND_ENABLE_ANALYTICS: bool = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
