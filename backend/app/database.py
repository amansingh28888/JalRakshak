"""
JalRakshak — Database setup (SQLAlchemy + SQLite)
"""
import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.config import get_settings


settings = get_settings()

# Ensure the data directory exists
_db_path = settings.database_url.replace("sqlite:///", "")
if not _db_path.startswith(":memory:"):
    Path(_db_path).parent.mkdir(parents=True, exist_ok=True)

# Create engine — StaticPool needed for SQLite in-memory tests; file DB uses NullPool-style
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Enable WAL mode and foreign keys for every connection
@event.listens_for(engine, "connect")
def _set_sqlite_pragmas(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that yields a database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Called on application startup."""
    from app.models import water_sample  # noqa: F401 — ensure model is registered
    Base.metadata.create_all(bind=engine)
