"""Lazy async SQLAlchemy resources, unused by health or application startup."""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings, parse_database_url


class Database:
    """Construct an engine only on explicit use; creation itself does not connect."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._engine: AsyncEngine | None = None
        self._session_factory: async_sessionmaker[AsyncSession] | None = None

    def _get_session_factory(self) -> async_sessionmaker[AsyncSession]:
        if self._session_factory is None:
            if self._settings.database_url is None:
                raise RuntimeError("DATABASE_URL is unset; database access is not configured")
            url = parse_database_url(self._settings.database_url.get_secret_value())
            self._engine = create_async_engine(
                url,
                pool_pre_ping=True,
                pool_size=self._settings.db_pool_size,
                pool_recycle=self._settings.db_pool_recycle_seconds,
                max_overflow=0,
                echo=False,
            )
            self._session_factory = async_sessionmaker(self._engine, expire_on_commit=False)
        return self._session_factory

    async def sessions(self) -> AsyncIterator[AsyncSession]:
        """Future dependency hook; callers own transactions, no automatic commit."""
        factory = self._get_session_factory()
        async with factory() as session:
            yield session

    async def dispose(self) -> None:
        if self._engine is not None:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None
