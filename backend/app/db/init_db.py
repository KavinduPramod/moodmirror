"""
Database Initialization Script
Uses Alembic migrations to create tables
"""

import sys
from pathlib import Path
import subprocess

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlmodel import Session
from app.db.session import engine, check_db_connection
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def verify_database_connection():
    """Verify database connection and database exists"""
    logger.info("Verifying database connection...")
    
    if not check_db_connection():
        logger.error("✗ Failed to connect to database")
        logger.error(f"  Database: {settings.DB_NAME_DEV if settings.ENV == 'development' else settings.DB_NAME_PROD}")
        logger.error(f"  Host: {settings.DB_HOST}:{settings.DB_PORT}")
        logger.error(f"  User: {settings.DB_USER}")
        logger.error("\nPlease ensure:")
        logger.error("  1. MariaDB is running")
        logger.error("  2. Database exists (moodmirror_dev or moodmirror)")
        logger.error("  3. User has proper permissions")
        logger.error("  4. Credentials in .env are correct")
        return False
    
    logger.info("✓ Database connection successful")
    logger.info(f"  Environment: {settings.ENV}")
    logger.info(f"  Database: {settings.DB_NAME_DEV if settings.ENV == 'development' else settings.DB_NAME_PROD}")
    return True


def run_migrations():
    """Run Alembic migrations to create/update tables"""
    logger.info("Running Alembic migrations...")
    
    try:
        # Get the backend directory (where alembic.ini is located)
        backend_dir = Path(__file__).parent.parent.parent
        
        # Run alembic upgrade head
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=backend_dir,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            logger.info("✓ Migrations applied successfully")
            if result.stdout:
                logger.info(f"  {result.stdout.strip()}")
            return True
        else:
            logger.error("✗ Migration failed")
            logger.error(f"  {result.stderr}")
            return False
            
    except FileNotFoundError:
        logger.error("✗ Alembic not found. Make sure it's installed:")
        logger.error("  pip install alembic")
        return False
    except Exception as e:
        logger.error(f"✗ Migration error: {e}")
        return False


def verify_tables():
    """Verify tables were created"""
    logger.info("Verifying tables...")
    
    with Session(engine) as session:
        try:
            from sqlalchemy import inspect
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            expected_tables = ["users", "analysis_logs", "recommendations", "system_logs"]
            
            if not tables:
                logger.warning("⚠ No tables found. Run migrations with: alembic upgrade head")
                return False
            
            for table in expected_tables:
                if table in tables:
                    logger.info(f"✓ Table '{table}' exists")
                else:
                    logger.warning(f"⚠ Table '{table}' missing")
            
            return True
            
        except Exception as e:
            logger.error(f"✗ Table verification failed: {e}")
            return False


def main():
    """Main initialization function"""
    logger.info("=" * 60)
    logger.info("MoodMirror Database Initialization")
    logger.info("=" * 60)
    logger.info("")
    
    success = True
    
    # Step 1: Verify database connection
    if not verify_database_connection():
        logger.error("\n" + "=" * 60)
        logger.error("✗ Database initialization failed")
        logger.error("=" * 60)
        sys.exit(1)
    
    logger.info("")
    
    # Step 2: Run migrations
    if not run_migrations():
        logger.warning("\n⚠ Migrations not applied. You can run them manually:")
        logger.warning("  alembic upgrade head")
        success = False
    
    logger.info("")
    
    # Step 3: Verify tables
    verify_tables()
    
    logger.info("")
    logger.info("=" * 60)
    if success:
        logger.info("✓ Database initialization completed successfully!")
    else:
        logger.info("⚠ Database initialization completed with warnings")
    logger.info("=" * 60)
    logger.info("")
    logger.info("To create/update tables, run:")
    logger.info("  alembic upgrade head")
    logger.info("")


if __name__ == "__main__":
    main()
