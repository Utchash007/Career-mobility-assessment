from unittest.mock import patch

import pytest

from app.core.config import Settings
from app.db.base import Base
from app.db.session import Database


def test_metadata_has_exactly_the_three_application_tables() -> None:
    from app.db import models  # noqa: F401 -- ensure metadata registration

    assert set(Base.metadata.tables) == {"profiles", "opportunities", "shortlist"}


@pytest.mark.asyncio
async def test_database_is_lazy_and_requires_url_only_on_use() -> None:
    with patch("app.db.session.create_async_engine", side_effect=AssertionError("DB touched")):
        database = Database(Settings(_env_file=None))
        await database.dispose()
        with pytest.raises(RuntimeError, match="DATABASE_URL is unset"):
            await anext(database.sessions())


@pytest.mark.asyncio
async def test_session_can_be_created_without_a_network_connection() -> None:
    # A SQLAlchemy session does not connect until SQL is executed. No SQL or tables here.
    database = Database(
        Settings(_env_file=None, database_url="postgresql+asyncpg://fake:fake@db.invalid/demo")
    )
    try:
        async for session in database.sessions():
            assert not session.in_transaction()
    finally:
        await database.dispose()
