"""
Database Models
SQLModel-based models for MoodMirror
"""

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    """Mental health risk levels"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRISIS = "crisis"


class User(SQLModel, table=True):
    """
    User Profile
    Stores Reddit user information for personalized recommendations
    """
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Reddit Identity (unique identifier)
    reddit_id: str = Field(unique=True, index=True, max_length=50)
    reddit_username: str = Field(index=True, max_length=100)
    
    # User Status
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = Field(default=None)
    last_analysis: Optional[datetime] = Field(default=None)
    
    # Privacy & Consent
    consent_given: bool = Field(default=False)
    consent_date: Optional[datetime] = Field(default=None)
    email_opt_in: bool = Field(default=False)
    email: Optional[str] = Field(default=None, max_length=255)
    
    # Analysis Count (for rate limiting & personalization)
    total_analyses: int = Field(default=0)
    
    # Relationships
    analysis_history: List["AnalysisLog"] = Relationship(back_populates="user")
    
    class Config:
        json_schema_extra = {
            "example": {
                "reddit_id": "t2_abc123",
                "reddit_username": "example_user",
                "is_active": True,
                "consent_given": True,
                "total_analyses": 5
            }
        }


class AnalysisLog(SQLModel, table=True):
    """
    Analysis Activity Log
    Stores anonymized analysis metadata (no actual predictions)
    Used for personalized recommendations and system monitoring
    """
    __tablename__ = "analysis_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # User Reference (for personalization)
    user_id: int = Field(foreign_key="users.id", index=True)
    
    # Analysis Metadata
    analysis_date: datetime = Field(default_factory=datetime.utcnow, index=True)
    risk_level: RiskLevel = Field(index=True)
    confidence_score: float = Field(ge=0.0, le=1.0)
    
    # Behavioral Metrics (for trend analysis)
    post_count: int = Field(default=0)
    comment_count: int = Field(default=0)
    avg_sentiment: Optional[float] = Field(default=None)
    
    # Session Info
    session_id: str = Field(max_length=100)
    ip_hash: Optional[str] = Field(default=None, max_length=64)  # Hashed for privacy
    
    # Email Report
    email_sent: bool = Field(default=False)
    
    # Relationships
    user: User = Relationship(back_populates="analysis_history")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "risk_level": "moderate",
                "confidence_score": 0.85,
                "post_count": 150,
                "comment_count": 300
            }
        }


class Recommendation(SQLModel, table=True):
    """
    Personalized Recommendations
    Stores recommendations shown to users based on analysis history
    """
    __tablename__ = "recommendations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # User Reference
    user_id: int = Field(foreign_key="users.id", index=True)
    
    # Recommendation Details
    recommendation_type: str = Field(max_length=50, index=True)  # helpline, resource, article, etc.
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None)
    url: Optional[str] = Field(default=None, max_length=500)
    
    # Tracking
    shown_at: datetime = Field(default_factory=datetime.utcnow)
    clicked: bool = Field(default=False)
    clicked_at: Optional[datetime] = Field(default=None)
    
    # Relevance
    relevance_score: float = Field(ge=0.0, le=1.0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "recommendation_type": "helpline",
                "title": "National Suicide Prevention Lifeline",
                "url": "https://988lifeline.org/",
                "relevance_score": 0.95
            }
        }


class SystemLog(SQLModel, table=True):
    """
    System Activity Log
    Monitors API usage and system health
    """
    __tablename__ = "system_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Log Details
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    log_level: str = Field(max_length=20, index=True)  # INFO, WARNING, ERROR, CRITICAL
    endpoint: Optional[str] = Field(default=None, max_length=255)
    message: str
    
    # Request Info
    ip_hash: Optional[str] = Field(default=None, max_length=64)
    user_agent: Optional[str] = Field(default=None, max_length=500)
    
    # Error Details (if applicable)
    error_type: Optional[str] = Field(default=None, max_length=100)
    stack_trace: Optional[str] = Field(default=None)
    
    class Config:
        json_schema_extra = {
            "example": {
                "log_level": "INFO",
                "endpoint": "/analyze",
                "message": "Analysis completed successfully"
            }
        }
