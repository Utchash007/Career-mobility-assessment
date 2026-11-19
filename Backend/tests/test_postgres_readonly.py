"""Opt-in real Postgres checks: read-only, opportunity data only, no user fixtures."""

import os

import pytest
import pytest_asyncio
from sqlalchemy import inspect, select, text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings, parse_database_url
from app.db.models import Opportunity
from app.db.seed import load_seed
from app.db.session import Database
from app.schemas.opportunity import OpportunitySeed

pytestmark = [
    pytest.mark.asyncio,
    pytest.mark.skipif(
        os.environ.get("BACKEND_READ_ONLY_DB_TESTS") != "1",
        reason="Read-only live database checks require explicit opt-in.",
    ),
]


@pytest_asyncio.fixture
async def connection():
    settings = Settings()
    if settings.direct_url is None:
        pytest.skip("No direct database URL is configured.")
    engine = create_async_engine(
        parse_database_url(settings.direct_url.get_secret_value()), poolclass=NullPool, echo=False
    )
    try:
        async with engine.connect() as connection:
            transaction = await connection.begin()
            await connection.execute(text("SET TRANSACTION READ ONLY"))
            try:
                yield connection
            finally:
                await transaction.rollback()
    finally:
        await engine.dispose()


async def test_migration_head_and_readonly_mode(connection) -> None:
    assert await connection.scalar(text("SELECT version_num FROM alembic_version")) == "0002"
    assert await connection.scalar(text("SHOW transaction_read_only")) == "on"


async def test_seeded_roles_round_trip(connection) -> None:
    slugs = [row.slug for row in load_seed()]
    columns = [getattr(Opportunity, field) for field in OpportunitySeed.model_fields]
    rows = (
        (await connection.execute(select(*columns).where(Opportunity.slug.in_(slugs))))
        .mappings()
        .all()
    )
    assert len(rows) == 12
    actual = {
        row["slug"]: OpportunitySeed.model_validate(dict(row)).model_dump(mode="json")
        for row in rows
    }
    expected = {row.slug: row.model_dump(mode="json") for row in load_seed()}
    assert actual == expected


async def test_constraints_and_indexes_exist(connection) -> None:
    def metadata(sync_connection):
        inspector = inspect(sync_connection)
        return (
            set(inspector.get_table_names()),
            inspector.get_unique_constraints("shortlist"),
            inspector.get_foreign_keys("shortlist"),
            inspector.get_indexes("shortlist"),
        )

    names, uniqueness, foreign_keys, indexes = await connection.run_sync(metadata)
    assert {"profiles", "opportunities", "shortlist", "alembic_version"} <= names
    assert any(item["column_names"] == ["user_id", "opportunity_id"] for item in uniqueness)
    assert all(item["options"].get("ondelete") == "CASCADE" for item in foreign_keys)
    assert any(item["name"] == "shortlist_opportunity_id_idx" for item in indexes)


async def test_identity_generation_and_database_types(connection) -> None:
    def columns(sync_connection):
        inspector = inspect(sync_connection)
        return inspector.get_columns("opportunities"), inspector.get_columns("profiles")

    opportunities, profiles = await connection.run_sync(columns)
    assert (
        next(item for item in opportunities if item["name"] == "id")["identity"]["always"] is True
    )
    assert str(next(item for item in profiles if item["name"] == "education")["type"]) == "JSONB"
    assert "ARRAY" in str(next(item for item in profiles if item["name"] == "skills")["type"])


async def test_pooled_application_connection_reads_seeded_opportunities() -> None:
    database = Database(Settings())
    try:
        async for session in database.sessions():
            async with session.begin():
                await session.execute(text("SET TRANSACTION READ ONLY"))
                ids = (
                    await session.scalars(
                        select(Opportunity.id).where(
                            Opportunity.slug.in_([role.slug for role in load_seed()])
                        )
                    )
                ).all()
                assert len(ids) == 12
                assert await session.scalar(text("SHOW transaction_read_only")) == "on"
    finally:
        await database.dispose()


@pytest.mark.skip(
    reason=(
        "User/profile-dependent database workflows skipped by request; "
        "no real Clerk user or database profile is created."
    )
)
async def test_user_owned_database_workflow() -> None:
    pass
