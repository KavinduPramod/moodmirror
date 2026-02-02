"""Initial migration - create all tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-02-02

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reddit_id', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('reddit_username', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('last_analysis', sa.DateTime(), nullable=True),
        sa.Column('consent_given', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('consent_date', sa.DateTime(), nullable=True),
        sa.Column('email_opt_in', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('email', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('total_analyses', sa.Integer(), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('ix_users_reddit_id', 'users', ['reddit_id'], unique=True)
    op.create_index('ix_users_reddit_username', 'users', ['reddit_username'], unique=False)
    
    # Create analysis_logs table
    op.create_table(
        'analysis_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('analysis_date', sa.DateTime(), nullable=False),
        sa.Column('risk_level', sa.Enum('LOW', 'MODERATE', 'HIGH', 'CRISIS', name='risklevel'), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('post_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comment_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_sentiment', sa.Float(), nullable=True),
        sa.Column('session_id', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('ip_hash', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=True),
        sa.Column('email_sent', sa.Boolean(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('ix_analysis_logs_analysis_date', 'analysis_logs', ['analysis_date'], unique=False)
    op.create_index('ix_analysis_logs_risk_level', 'analysis_logs', ['risk_level'], unique=False)
    op.create_index('ix_analysis_logs_user_id', 'analysis_logs', ['user_id'], unique=False)
    
    # Create recommendations table
    op.create_table(
        'recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('recommendation_type', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('url', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('shown_at', sa.DateTime(), nullable=False),
        sa.Column('clicked', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('clicked_at', sa.DateTime(), nullable=True),
        sa.Column('relevance_score', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('ix_recommendations_recommendation_type', 'recommendations', ['recommendation_type'], unique=False)
    
    # Create system_logs table
    op.create_table(
        'system_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('log_level', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('endpoint', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('ip_hash', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=True),
        sa.Column('user_agent', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('error_type', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
        sa.Column('stack_trace', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('ix_system_logs_log_level', 'system_logs', ['log_level'], unique=False)
    op.create_index('ix_system_logs_timestamp', 'system_logs', ['timestamp'], unique=False)


def downgrade() -> None:
    op.drop_table('system_logs')
    op.drop_table('recommendations')
    op.drop_table('analysis_logs')
    op.drop_table('users')
