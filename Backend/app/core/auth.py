"""Networkless Clerk session verification and an authentication-first boundary."""

from dataclasses import dataclass
from typing import Annotated

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.types import ASGIApp, Receive, Scope, Send, Message

from app.core.config import Settings
from app.core.errors import APIError, error_response

bearer_scheme = HTTPBearer(auto_error=False, scheme_name="ClerkSession")


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    session_id: str


class TokenVerifier:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._public_key: RSAPublicKey | None = None

    def verify(self, request: Request) -> CurrentUser:
        values = [value for name, value in request.scope["headers"] if name.lower() == b"authorization"]
        if len(values) != 1:
            raise APIError(401, "UNAUTHENTICATED", "Sign in to continue.")
        header = request.headers.get("authorization", "")
        parts = header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise APIError(401, "UNAUTHENTICATED", "Sign in to continue.")
        if len(parts[1]) > 16384:
            raise APIError(401, "UNAUTHENTICATED", "Session token is invalid.")
        issuer = self.settings.trusted_clerk_issuer
        if self.settings.auth_mode == "disabled" or self.settings.jwks_public_key is None or issuer is None:
            raise APIError(503, "SERVICE_UNAVAILABLE", "Authentication is not configured.")
        if self._public_key is None:
            try:
                pem = self.settings.jwks_public_key.get_secret_value().replace("\\n", "\n").encode()
                key = serialization.load_pem_public_key(pem)
                if not isinstance(key, RSAPublicKey) or key.key_size < 2048:
                    raise ValueError("Unsupported signing key")
                self._public_key = key
            except (ValueError, TypeError):
                raise APIError(503, "SERVICE_UNAVAILABLE", "Authentication signing key is not configured correctly.") from None
        try:
            claims = jwt.decode(
                parts[1],
                self._public_key,
                algorithms=["RS256"],
                issuer=issuer,
                leeway=self.settings.clerk_clock_skew_seconds,
                options={"require": ["exp", "nbf", "iat", "iss", "sub", "sid", "azp"], "verify_aud": False},
            )
            if any(type(claims[name]) is not int for name in ("exp", "nbf", "iat")):
                raise ValueError("Invalid time claim")
            if claims["azp"] not in self.settings.trusted_frontend_origins:
                raise ValueError("Disallowed authorized party")
            user_id, session_id = claims["sub"], claims["sid"]
            if not isinstance(user_id, str) or not user_id.startswith("user_") or len(user_id) > 200:
                raise ValueError("Invalid user identity")
            if not isinstance(session_id, str) or not session_id.startswith("sess_") or claims.get("sts") == "pending":
                raise ValueError("Not an active user session")
            return CurrentUser(user_id=user_id, session_id=session_id)
        except (jwt.PyJWTError, ValueError, TypeError, KeyError):
            raise APIError(401, "UNAUTHENTICATED", "Session token is invalid or expired.") from None


class AuthenticationBoundary:
    def __init__(self, app: ASGIApp, settings: Settings):
        self.app = app
        self.verifier = TokenVerifier(settings)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        protected = scope["type"] == "http" and (scope["path"] == "/api/v1" or scope["path"].startswith("/api/v1/"))
        if not protected or scope["method"] == "OPTIONS":
            await self.app(scope, receive, send)
            return
        request = Request(scope, receive=receive)
        try:
            user = self.verifier.verify(request)
            scope.setdefault("state", {})["current_user"] = user
            if scope["method"] in {"PUT", "POST", "PATCH"}:
                if request.headers.get("content-type", "").partition(";")[0].strip().lower() != "application/json":
                    raise APIError(415, "UNSUPPORTED_MEDIA_TYPE", "Send a JSON request with Content-Type: application/json.")
        except APIError as error:
            headers = {"WWW-Authenticate": "Bearer"} if error.status == 401 else None
            await error_response(error, headers)(scope, receive, send)
            return

        async def private_send(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = [(name, value) for name, value in message.get("headers", []) if name.lower() != b"cache-control"]
                message = {**message, "headers": [*headers, (b"cache-control", b"private, no-store")]}
            await send(message)

        await self.app(scope, receive, private_send)


def get_current_user(
    request: Request,
    _credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> CurrentUser:
    user = getattr(request.state, "current_user", None)
    if user is None:
        raise APIError(401, "UNAUTHENTICATED", "Sign in to continue.")
    return user


type UserDependency = Annotated[CurrentUser, Depends(get_current_user)]
