"""
Database Connection and Session Management
"""

from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,   # Recycle connections after 1 hour
)


def init_db():
    """
    Initialize database - create all tables
    Call this on application startup
    """
    try:
        logger.info("Initializing database...")
        SQLModel.metadata.create_all(engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


def get_session():
    """
    Get database session
    Use as dependency in FastAPI endpoints
    
    Example:
        @app.get("/users")
        def get_users(session: Session = Depends(get_session)):
            users = session.exec(select(User)).all()
            return users
    """
    with Session(engine) as session:
        yield session


def check_db_connection():
    """
    Check if database connection is working
    Returns True if successful, False otherwise
    """
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1"))
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
