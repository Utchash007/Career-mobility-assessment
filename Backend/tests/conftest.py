import pytest

from app.core.config import get_settings


@pytest.fixture(autouse=True)
def isolated_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Tests do not depend on a developer's external credentials or cached settings."""
    for name in (
        "ENV",
        "AUTH_MODE",
        "CORS_ORIGINS",
        "DATABASE_URL",
        "DATABASE_URL_POOLED",
        "DIRECT_URL",
        "DB_POOL_SIZE",
        "DB_POOL_RECYCLE_SECONDS",
        "JWKS_PUBLIC_KEY",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_ISSUER",
        "CLERK_AUTHORIZED_PARTIES",
        "CLERK_CLOCK_SKEW_SECONDS",
    ):
        monkeypatch.delenv(name, raising=False)
    get_settings.cache_clear()
