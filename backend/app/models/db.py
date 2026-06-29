"""
SQLAlchemy engine and session configuration.

Connects to PostgreSQL via DATABASE_URL from environment.
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=settings.debug,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    """Dependency for FastAPI endpoints to get a database session."""
    async with AsyncSessionLocal() as session:
        yield session
