"""
Database engine and session management for AgentForge.
Uses SQLAlchemy async engine with PostgreSQL.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from backend.config import get_config

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


config = get_config()
engine = create_async_engine(
    config.database_url,
    echo=config.get("database.echo", False),
    pool_size=config.get("database.pool_size", 20),
    max_overflow=config.get("database.max_overflow", 10),
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """Dependency that yields a database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized")


async def close_db():
    """Dispose engine on shutdown."""
    await engine.dispose()
    logger.info("Database connection closed")
