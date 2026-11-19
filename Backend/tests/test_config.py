from pathlib import Path

import pytest
from pydantic import ValidationError

from app.core.config import BACKEND_DIRECTORY, ENV_FILES, Settings


def test_defaults_need_no_external_credentials() -> None:
    settings = Settings(_env_file=None)
    assert settings.database_url is None
    assert settings.direct_url is None
    assert settings.cors_origins == ["http://localhost:3000"]
    assert settings.auth_mode == "auto"


def test_env_example_is_valid_without_credentials() -> None:
    settings = Settings(_env_file=Path(__file__).resolve().parents[1] / ".env.example")
    assert settings.database_url is None
    assert settings.direct_url is None


def test_settings_read_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv("CORS_ORIGINS", '["https://frontend.example"]')
    settings = Settings(_env_file=None)
    assert settings.env == "test"
    assert settings.cors_origins == ["https://frontend.example"]


@pytest.mark.parametrize("value", ["", "   ", None])
def test_blank_optional_database_urls_are_unset(value: str | None) -> None:
    settings = Settings(_env_file=None, database_url=value, direct_url=value)
    assert settings.database_url is None
    assert settings.direct_url is None


@pytest.mark.parametrize("field", ["database_url", "direct_url"])
@pytest.mark.parametrize(
    "value",
    [
        "not-a-url",
        "sqlite:///test.db",
        "postgresql+asyncpg://fake:fake@db.invalid",
        "postgresql+asyncpg://fake:fake@db.invalid:wrong/demo",
        "postgresql+asyncpg://fake:fake@db.invalid/demo?sslmode=invalid",
        "postgresql+asyncpg://fake:fake@db.invalid/demo?channel_binding=invalid",
        "postgresql+asyncpg://fake:fake@db.invalid/demo?sslmode=require&ssl=disable",
    ],
)
def test_provided_invalid_database_urls_fail(field: str, value: str) -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **{field: value})


def test_valid_postgres_urls_and_secrets_are_not_displayed() -> None:
    settings = Settings(
        _env_file=None,
        database_url="postgresql+asyncpg://fake:fake_password@db.invalid/demo?ssl=require",
    )
    assert settings.database_url is not None
    assert "fake_password" not in repr(settings)
    with pytest.raises(ValidationError) as exc_info:
        Settings(_env_file=None, database_url="sqlite://fake:fake_password@db.invalid/demo")
    assert "fake_password" not in str(exc_info.value)


@pytest.mark.parametrize("env", ["development", "test", "production"])
@pytest.mark.parametrize("mode", ["dev", "clerk"])
def test_dev_bypass_and_unconfigured_explicit_clerk_are_rejected(env: str, mode: str) -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, env=env, auth_mode=mode)


def test_production_has_no_fixed_user_bypass() -> None:
    settings = Settings(_env_file=None, env="production")
    assert settings.auth_mode == "auto"
    assert settings.trusted_clerk_issuer is None
    assert settings.jwks_public_key is None


@pytest.mark.parametrize(
    "origin",
    [
        "*",
        "https://*.example",
        "http://localhost:3000/",
        "http://localhost:3000/path",
        "http://localhost:3000?query=1",
        "https://user:password@example.com",
        "http://localhost:wrong",
        " http://localhost:3000",
        "ftp://localhost:3000",
    ],
)
def test_cors_requires_exact_origins(origin: str) -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_origins=[origin])


def test_default_env_paths_are_anchored_to_the_projects() -> None:
    assert BACKEND_DIRECTORY == Path(__file__).resolve().parents[1]
    assert ENV_FILES == (BACKEND_DIRECTORY.parent / ".env", BACKEND_DIRECTORY / ".env")
    assert all(path.is_absolute() for path in ENV_FILES)


def test_root_env_loads_from_an_unrelated_working_directory(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root_env = tmp_path / ".env"
    backend_dir = tmp_path / "Backend"
    backend_dir.mkdir()
    root_env.write_text("ENV=test\nCLERK_SECRET_KEY=fake_unused\n", encoding="utf-8")
    monkeypatch.setitem(Settings.model_config, "env_file", (root_env, backend_dir / ".env"))
    monkeypatch.chdir(backend_dir)
    assert Settings().env == "test"


def test_backend_env_overrides_root_and_process_env_overrides_both(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root_env = tmp_path / ".env"
    backend_env = tmp_path / "backend.env"
    root_env.write_text("ENV=test\nDB_POOL_SIZE=3\n", encoding="utf-8")
    backend_env.write_text("ENV=development\n", encoding="utf-8")
    monkeypatch.setitem(Settings.model_config, "env_file", (root_env, backend_env))
    assert Settings().env == "development"
    assert Settings().db_pool_size == 3
    monkeypatch.setenv("ENV", "production")
    assert Settings().env == "production"


def test_missing_env_files_are_optional(tmp_path: Path) -> None:
    settings = Settings(_env_file=(tmp_path / ".env", tmp_path / "Backend" / ".env"))
    assert settings.database_url is None
    assert settings.env == "development"


@pytest.mark.parametrize("driver", ["postgres", "postgresql", "postgresql+asyncpg"])
def test_neon_urls_are_normalized_without_editing_env_files(driver: str) -> None:
    settings = Settings(
        _env_file=None,
        database_url=f"{driver}://fake:fake@db.invalid/demo?sslmode=require&channel_binding=require",
    )
    assert settings.database_url is not None
    assert (
        settings.database_url.get_secret_value()
        == "postgresql+asyncpg://fake:fake@db.invalid/demo?ssl=require"
    )
    assert settings.direct_url is None


def test_paired_neon_urls_use_pool_for_app_and_direct_for_migrations() -> None:
    settings = Settings(
        _env_file=None,
        database_url="postgresql://fake:fake@direct.invalid/demo?sslmode=require",
        database_url_pooled="postgresql://fake:fake@pool.invalid/demo?sslmode=require",
    )
    assert settings.database_url is not None
    assert settings.direct_url is not None
    assert "pool.invalid" in settings.database_url.get_secret_value()
    assert "direct.invalid" in settings.direct_url.get_secret_value()


def test_explicit_direct_url_is_preserved_with_paired_urls() -> None:
    settings = Settings(
        _env_file=None,
        database_url="postgresql://fake:fake@direct.invalid/demo",
        database_url_pooled="postgresql://fake:fake@pool.invalid/demo",
        direct_url="postgresql://fake:fake@explicit.invalid/demo",
    )
    assert settings.direct_url is not None
    assert "explicit.invalid" in settings.direct_url.get_secret_value()


def test_pool_only_does_not_become_a_migration_url() -> None:
    settings = Settings(
        _env_file=None,
        database_url_pooled="postgresql://fake:fake@pool.invalid/demo",
    )
    assert settings.database_url is not None
    assert settings.direct_url is None


@pytest.mark.parametrize("parties", [None, ["http://localhost:3000", "http://127.0.0.1:3000"]])
def test_single_render_service_uses_public_origin_instead_of_copied_local_settings(parties) -> None:
    settings = Settings(
        _env_file=None,
        panama_single_container=True,
        render_external_url="https://career-mobility-assessment.onrender.com/",
        next_public_api_url="http://127.0.0.1:8000",
        cors_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        clerk_authorized_parties=parties,
    )
    expected = ["https://career-mobility-assessment.onrender.com"]
    assert settings.cors_origins == expected
    assert settings.trusted_frontend_origins == expected


def test_single_render_service_preserves_explicit_public_custom_domains() -> None:
    settings = Settings(
        _env_file=None,
        panama_single_container=True,
        render_external_url="https://career-mobility-assessment.onrender.com",
        next_public_api_url="https://careers.example/",
        cors_origins=["https://another.example", "http://localhost:3000"],
        clerk_authorized_parties=["https://another.example", "http://localhost:3000"],
    )
    assert settings.trusted_frontend_origins == [
        "https://another.example",
        "https://career-mobility-assessment.onrender.com",
        "https://careers.example",
    ]
    assert settings.cors_origins == settings.trusted_frontend_origins


def test_render_origin_is_not_inferred_for_separate_or_local_services() -> None:
    settings = Settings(
        _env_file=None,
        panama_single_container=False,
        render_external_url="https://career-mobility-assessment.onrender.com",
        next_public_api_url="http://127.0.0.1:8000",
        cors_origins=["http://localhost:3000"],
        clerk_authorized_parties=["http://localhost:3000"],
    )
    assert settings.cors_origins == ["http://localhost:3000"]
    assert settings.trusted_frontend_origins == ["http://localhost:3000"]


@pytest.mark.parametrize(
    "value",
    [
        "http://public.example",
        "https://user:password@example.com",
        "https://public.example/path",
        "https://public.example?query=1",
        "https://*.example",
        "https://localhost",
    ],
)
def test_single_render_service_rejects_unsafe_deployment_origins(value: str) -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, panama_single_container=True, render_external_url=value)
