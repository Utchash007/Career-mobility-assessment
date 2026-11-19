"""Environment configuration; external credentials are optional."""

from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError

BACKEND_DIRECTORY = Path(__file__).resolve().parents[2]
ENV_FILES = (BACKEND_DIRECTORY.parent / ".env", BACKEND_DIRECTORY / ".env")


def parse_database_url(value: str) -> URL:
    """Accept Neon or asyncpg URLs without including secrets in errors."""
    try:
        url = make_url(value)
    except (ArgumentError, ValueError, TypeError):
        raise ValueError("Database URL must be a valid SQLAlchemy URL") from None

    if url.drivername not in {"postgres", "postgresql", "postgresql+asyncpg"}:
        raise ValueError("Database URL must use Postgres")
    if not url.host or not url.database or not url.username:
        raise ValueError("Database URL must include a host, database and username")
    query = dict(url.query)
    sslmode = query.pop("sslmode", None)
    if sslmode is not None:
        if sslmode not in {"disable", "allow", "prefer", "require", "verify-ca", "verify-full"}:
            raise ValueError("Database URL has an unsupported sslmode")
        if "ssl" in query and query["ssl"] != sslmode:
            raise ValueError("Database URL has conflicting SSL options")
        query["ssl"] = sslmode
    # asyncpg does not accept libpq's channel_binding option.
    channel_binding = query.pop("channel_binding", None)
    if channel_binding is not None and channel_binding not in {"disable", "prefer", "require"}:
        raise ValueError("Database URL has an unsupported channel_binding option")
    return url.set(drivername="postgresql+asyncpg", query=query)


class Settings(BaseSettings):
    """Load root and Backend .env files independently of the working directory."""

    model_config = SettingsConfigDict(
        env_file=ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        hide_input_in_errors=True,
    )

    env: Literal["development", "test", "production"] = "development"
    # Fail closed: no dev bypass or Clerk mode is implemented in this scaffold.
    auth_mode: Literal["disabled"] = "disabled"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    database_url: SecretStr | None = None
    database_url_pooled: SecretStr | None = None
    direct_url: SecretStr | None = None
    db_pool_size: int = Field(default=5, ge=1, le=20)
    db_pool_recycle_seconds: int = Field(default=300, ge=1, le=300)

    @field_validator("database_url", "database_url_pooled", "direct_url", mode="before")
    @classmethod
    def empty_database_url_is_unset(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip() or None
        return value

    @field_validator("database_url", "database_url_pooled", "direct_url")
    @classmethod
    def validate_database_url(cls, value: SecretStr | None) -> SecretStr | None:
        if value is not None:
            url = parse_database_url(value.get_secret_value())
            return SecretStr(url.render_as_string(hide_password=False))
        return value

    @model_validator(mode="after")
    def resolve_paired_database_urls(self) -> "Settings":
        # Paired convention: DATABASE_URL is direct, DATABASE_URL_POOLED is pooled.
        # Legacy DATABASE_URL-only settings remain application-only; never infer a
        # migration URL from that potentially pooled value.
        if self.database_url_pooled is not None:
            if self.direct_url is None:
                self.direct_url = self.database_url
            self.database_url = self.database_url_pooled
        return self

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, origins: list[str]) -> list[str]:
        for origin in origins:
            parsed = urlsplit(origin)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.hostname
                or parsed.username is not None
                or parsed.password is not None
                or parsed.path
                or parsed.query
                or parsed.fragment
                or "*" in origin
                or origin != origin.strip()
            ):
                raise ValueError("CORS origins must be exact HTTP(S) origins, without paths or '*'")
            # Validate a supplied port rather than silently accepting malformed origins.
            try:
                _ = parsed.port
            except ValueError as exc:
                raise ValueError("CORS origin has an invalid port") from exc
        return list(dict.fromkeys(origins))


@lru_cache
def get_settings() -> Settings:
    return Settings()
