"""Locally signed tokens only; no Clerk account, session or database user is created."""

import json
import time
from unittest.mock import patch

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from httpx import ASGITransport, AsyncClient

from app.api.dependencies import get_session
from app.core.config import Settings
from app.main import create_app


@pytest.fixture(scope="module")
def signing_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def auth_settings(key, **settings) -> Settings:
    public = (
        key.public_key()
        .public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
        .decode()
    )
    return Settings(
        _env_file=None,
        auth_mode="clerk",
        jwks_public_key=public,
        clerk_issuer="https://fictional.clerk.accounts.dev",
        **settings,
    )


def token(key, **changes) -> str:
    now = int(time.time())
    claims = {
        "iss": "https://fictional.clerk.accounts.dev",
        "sub": "user_fictional_test",
        "sid": "sess_fictional_test",
        "azp": "http://localhost:3000",
        "iat": now,
        "nbf": now - 1,
        "exp": now + 300,
    }
    claims.update(changes)
    for name in [name for name, value in claims.items() if value is None]:
        del claims[name]
    return jwt.encode(claims, key, algorithm="RS256")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "path,method",
    [
        ("/api/v1/profile", "GET"),
        ("/api/v1/profile", "PUT"),
        ("/api/v1/profile/sample", "POST"),
        ("/api/v1/opportunities", "GET"),
        ("/api/v1/opportunities/1", "GET"),
        ("/api/v1/matches", "GET"),
        ("/api/v1/matches/1", "GET"),
        ("/api/v1/shortlist", "GET"),
        ("/api/v1/shortlist/1", "POST"),
        ("/api/v1/shortlist/1", "PATCH"),
        ("/api/v1/shortlist/1", "DELETE"),
        ("/api/v1/me", "DELETE"),
    ],
)
async def test_every_business_operation_requires_authentication(path: str, method: str) -> None:
    app = create_app(Settings(_env_file=None))
    with patch(
        "app.db.session.create_async_engine", side_effect=AssertionError("Database was touched")
    ):
        async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
            response = await client.request(method, path)
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHENTICATED"
    assert response.headers["cache-control"] == "private, no-store"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "changes",
    [
        {"exp": 1},
        {"nbf": 4102444800},
        {"iat": 4102444800},
        {"iss": "https://attacker.example"},
        {"azp": "https://attacker.example"},
        {"azp": None},
        {"sub": "machine_test"},
        {"sid": None},
        {"sts": "pending"},
        {"exp": "9999999999"},
    ],
)
async def test_invalid_claims_fail_before_validation(signing_key, changes: dict) -> None:
    app = create_app(auth_settings(signing_key))
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.put(
            "/api/v1/profile?user_id=attacker",
            content="not JSON",
            headers={"Authorization": "Bearer " + token(signing_key, **changes)},
        )
    assert response.status_code == 401 and "fields" not in response.json()


@pytest.mark.asyncio
async def test_wrong_signature_algorithm_and_malformed_header(signing_key) -> None:
    app = create_app(auth_settings(signing_key))
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    unsigned = jwt.encode({"sub": "user_fictional_test"}, "", algorithm="none")
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        for value in ("not-a-token", token(other), unsigned):
            assert (
                await client.get("/api/v1/profile", headers={"Authorization": "Bearer " + value})
            ).status_code == 401
        duplicate = await client.get(
            "/api/v1/profile",
            headers=[
                ("Authorization", "Bearer " + token(signing_key)),
                ("Authorization", "Bearer " + token(signing_key)),
            ],
        )
        assert duplicate.status_code == 401


@pytest.mark.asyncio
async def test_valid_local_token_reaches_routing_without_database(signing_key) -> None:
    app = create_app(auth_settings(signing_key))
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/no-such-endpoint", headers={"Authorization": "Bearer " + token(signing_key)}
        )
    assert response.status_code == 404
    assert response.headers["cache-control"] == "private, no-store"


@pytest.mark.asyncio
async def test_unconfigured_signing_key_fails_closed(signing_key) -> None:
    for settings in [
        Settings(_env_file=None),
        Settings(_env_file=None, auth_mode="disabled"),
        Settings(
            _env_file=None,
            jwks_public_key="invalid-pem",
            clerk_issuer="https://fictional.clerk.accounts.dev",
        ),
    ]:
        app = create_app(settings)
        async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/profile", headers={"Authorization": "Bearer " + token(signing_key)}
            )
        assert response.status_code == 503


@pytest.mark.asyncio
async def test_authenticated_body_and_query_contracts_without_persistence(signing_key) -> None:
    app = create_app(auth_settings(signing_key))

    async def unused_session():
        yield None

    app.dependency_overrides[get_session] = unused_session
    headers = {"Authorization": "Bearer " + token(signing_key)}
    async with AsyncClient(
        transport=ASGITransport(app), base_url="http://test", headers=headers
    ) as client:
        assert (await client.put("/api/v1/profile", content="{}")).status_code == 415
        for value in (
            {"full_name": "x", "user_id": "other"},
            {"full_name": "x", "birthday": "secret-not-a-date"},
            None,
        ):
            response = await client.request(
                "PUT",
                "/api/v1/profile",
                content=json.dumps(value),
                headers={"Content-Type": "application/json"},
            )
            assert response.status_code == 422
            assert "secret-not-a-date" not in response.text
        assert (await client.get("/api/v1/matches?sort=id_asc")).status_code == 422
        assert (await client.get("/api/v1/opportunities?page=1&page=2")).status_code == 422
        assert (await client.request("DELETE", "/api/v1/me", json={})).status_code == 422


def test_openapi_security_queries_and_common_errors() -> None:
    schema = create_app(Settings(_env_file=None)).openapi()
    assert schema["components"]["securitySchemes"]["ClerkSession"]["scheme"] == "bearer"
    for path, methods in schema["paths"].items():
        for operation in methods.values():
            if path == "/health":
                assert "security" not in operation
            else:
                assert operation["security"] == [{"ClerkSession": []}]
                assert operation["responses"]["422"]["content"]["application/json"]["schema"][
                    "$ref"
                ].endswith("APIError")
    assert {
        parameter["name"] for parameter in schema["paths"]["/api/v1/matches"]["get"]["parameters"]
    } == {"page", "page_size", "q", "country", "type", "work_mode", "label"}


@pytest.mark.asyncio
async def test_single_render_service_accepts_public_tokens_but_still_rejects_other_origins(
    signing_key,
) -> None:
    origin = "https://career-mobility-assessment.onrender.com"
    app = create_app(
        auth_settings(
            signing_key,
            panama_single_container=True,
            render_external_url=origin,
            next_public_api_url="http://127.0.0.1:8000",
            cors_origins=["http://localhost:3000"],
            clerk_authorized_parties=["http://localhost:3000"],
        )
    )
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        for azp, status in [
            (origin, 404),
            ("https://attacker.example", 401),
            ("http://localhost:3000", 401),
            ("http://127.0.0.1:8000", 401),
            (None, 401),
        ]:
            response = await client.get(
                "/api/v1/no-such-endpoint",
                headers={"Authorization": "Bearer " + token(signing_key, azp=azp)},
            )
            assert response.status_code == status


@pytest.mark.asyncio
async def test_rejection_diagnostics_do_not_log_tokens_claims_or_identities(signing_key, caplog) -> None:
    encoded = token(signing_key, azp="https://private-origin.example")
    app = create_app(auth_settings(signing_key))
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/profile", headers={"Authorization": "Bearer " + encoded}
        )
    assert response.status_code == 401
    assert "reason=authorized_party_mismatch" in caplog.text
    for private in [encoded, "user_fictional_test", "sess_fictional_test", "private-origin.example"]:
        assert private not in caplog.text
