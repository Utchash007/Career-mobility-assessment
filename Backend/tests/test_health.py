from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.main import create_app


@pytest.mark.asyncio
@pytest.mark.parametrize("database_url", [None, "postgresql+asyncpg://fake:fake@db.invalid/demo"])
async def test_lifespan_and_health_do_not_initialize_database(database_url: str | None) -> None:
    settings = Settings(_env_file=None, database_url=database_url)
    with patch("app.db.session.create_async_engine", side_effect=AssertionError("DB touched")):
        app = create_app(settings)
        async with app.router.lifespan_context(app):
            async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
                response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_lifespan_disposes_optional_database_resources() -> None:
    app = create_app(Settings(_env_file=None))
    app.state.database.dispose = AsyncMock()
    async with app.router.lifespan_context(app):
        app.state.database.dispose.assert_not_awaited()
    app.state.database.dispose.assert_awaited_once()


@pytest.mark.asyncio
async def test_only_liveness_is_in_openapi_and_business_paths_are_absent() -> None:
    app = create_app(Settings(_env_file=None))
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        schema = await client.get("/openapi.json")
        assert schema.status_code == 200
        assert set(schema.json()["paths"]) == {"/health"}
        assert (await client.get("/docs")).status_code == 200
        assert (await client.get("/redoc")).status_code == 200
        assert (await client.get("/api/v1/profile")).status_code == 404
        assert (await client.post("/health")).status_code == 405


@pytest.mark.asyncio
async def test_cors_allows_only_exact_default_origin() -> None:
    app = create_app(Settings(_env_file=None))
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        allowed = await client.get("/health", headers={"Origin": "http://localhost:3000"})
        assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
        assert "access-control-allow-credentials" not in allowed.headers
        for origin in ("https://untrusted.example", "http://localhost:3001"):
            denied = await client.get("/health", headers={"Origin": origin})
            assert "access-control-allow-origin" not in denied.headers
        preflight = await client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            },
        )
        assert preflight.status_code == 200
        denied_method = await client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert denied_method.status_code == 400
