"""
JalRakshak — Database setup (SQLAlchemy)
Supports SQLite and PostgreSQL/Supabase
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.config import get_settings


settings = get_settings()


# ─────────────────────────────────────────────────────────────
# Database URL
# ─────────────────────────────────────────────────────────────

DATABASE_URL = settings.database_url


# ─────────────────────────────────────────────────────────────
# Engine configuration
# ─────────────────────────────────────────────────────────────

if DATABASE_URL.startswith("sqlite"):
    # SQLite-specific configuration
    connect_args = {"check_same_thread": False}

    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        echo=False,
    )

    # SQLite-specific pragmas only
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

else:
    # PostgreSQL / Supabase configuration
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=1800,
        echo=False,
    )


# ─────────────────────────────────────────────────────────────
# Session
# ─────────────────────────────────────────────────────────────

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ─────────────────────────────────────────────────────────────
# Base
# ─────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ─────────────────────────────────────────────────────────────
# FastAPI DB dependency
# ─────────────────────────────────────────────────────────────

def get_db():
    """FastAPI dependency that yields a database session."""
    db: Session = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# Database initialization
# ─────────────────────────────────────────────────────────────

def init_db():
    """Create all application tables if they do not already exist."""

    from app.models import (
        water_sample,
        user_profile,
        audit_log,
    )  # noqa: F401

    Base.metadata.create_all(bind=engine)