"""Networkless Clerk session verification and an authentication-first boundary."""

import logging
from dataclasses import dataclass
from typing import Annotated, NoReturn

import jwt
from cryptography.exceptions import UnsupportedAlgorithm
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import Settings
from app.core.errors import APIError, error_response

bearer_scheme = HTTPBearer(auto_error=False, scheme_name="ClerkSession")
logger = logging.getLogger("uvicorn.error")


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    session_id: str


class TokenVerifier:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._public_key: RSAPublicKey | None = None

    def _reject(self, reason: str, message: str = "Session token is invalid or expired.") -> NoReturn:
        # Fixed diagnostic codes only: no token, claims, identities or headers.
        logger.warning("Clerk authentication rejected: reason=%s", reason)
        raise APIError(401, "UNAUTHENTICATED", message) from None

    def verify(self, request: Request) -> CurrentUser:
        values = [
            value for name, value in request.scope["headers"] if name.lower() == b"authorization"
        ]
        if len(values) != 1:
            self._reject("missing_or_duplicate_bearer", "Sign in to continue.")
        header = request.headers.get("authorization", "")
        parts = header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            self._reject("malformed_bearer", "Sign in to continue.")
        if len(parts[1]) > 16384:
            self._reject("oversized_token", "Session token is invalid.")
        issuer = self.settings.trusted_clerk_issuer
        if (
            self.settings.auth_mode == "disabled"
            or self.settings.jwks_public_key is None
            or issuer is None
        ):
            logger.error("Clerk authentication unavailable: reason=missing_configuration")
            raise APIError(503, "SERVICE_UNAVAILABLE", "Authentication is not configured.")
        if self._public_key is None:
            try:
                pem = self.settings.jwks_public_key.get_secret_value().replace("\\n", "\n").encode()
                key = serialization.load_pem_public_key(pem)
                if not isinstance(key, RSAPublicKey) or key.key_size < 2048:
                    raise ValueError("Unsupported signing key")
                self._public_key = key
            except (ValueError, TypeError, UnsupportedAlgorithm):
                logger.error("Clerk authentication unavailable: reason=invalid_signing_key")
                raise APIError(
                    503,
                    "SERVICE_UNAVAILABLE",
                    "Authentication signing key is not configured correctly.",
                ) from None
        try:
            claims = jwt.decode(
                parts[1],
                self._public_key,
                algorithms=["RS256"],
                issuer=issuer,
                leeway=self.settings.clerk_clock_skew_seconds,
                options={
                    "require": ["exp", "nbf", "iat", "iss", "sub", "sid", "azp"],
                    "verify_aud": False,
                },
            )
            if any(type(claims[name]) is not int for name in ("exp", "nbf", "iat")):
                self._reject("invalid_time_claim")
            if claims["azp"] not in self.settings.trusted_frontend_origins:
                self._reject("authorized_party_mismatch")
            user_id, session_id = claims["sub"], claims["sid"]
            if (
                not isinstance(user_id, str)
                or not user_id.startswith("user_")
                or len(user_id) > 200
            ):
                self._reject("invalid_user_identity")
            if not isinstance(session_id, str) or not session_id.startswith("sess_"):
                self._reject("invalid_session_identity")
            if claims.get("sts") not in {None, "active"}:
                self._reject("inactive_session")
            return CurrentUser(user_id=user_id, session_id=session_id)
        except jwt.ExpiredSignatureError:
            self._reject("token_expired")
        except jwt.ImmatureSignatureError:
            self._reject("token_not_yet_valid")
        except jwt.InvalidSignatureError:
            self._reject("signature_mismatch")
        except jwt.InvalidIssuerError:
            self._reject("issuer_mismatch")
        except jwt.InvalidAlgorithmError:
            self._reject("invalid_algorithm")
        except jwt.InvalidIssuedAtError:
            self._reject("invalid_time_claim")
        except jwt.MissingRequiredClaimError as error:
            claim = (
                error.claim
                if error.claim in {"exp", "nbf", "iat", "iss", "sub", "sid", "azp"}
                else "claim"
            )
            self._reject("missing_required_" + claim)
        except (jwt.PyJWTError, ValueError, TypeError, KeyError):
            self._reject("invalid_token")


class AuthenticationBoundary:
    def __init__(self, app: ASGIApp, settings: Settings):
        self.app = app
        self.verifier = TokenVerifier(settings)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        protected = scope["type"] == "http" and (
            scope["path"] == "/api/v1" or scope["path"].startswith("/api/v1/")
        )
        if not protected or scope["method"] == "OPTIONS":
            await self.app(scope, receive, send)
            return
        request = Request(scope, receive=receive)
        try:
            user = self.verifier.verify(request)
            scope.setdefault("state", {})["current_user"] = user
            if scope["method"] in {"PUT", "POST", "PATCH"}:
                if (
                    request.headers.get("content-type", "").partition(";")[0].strip().lower()
                    != "application/json"
                ):
                    raise APIError(
                        415,
                        "UNSUPPORTED_MEDIA_TYPE",
                        "Send a JSON request with Content-Type: application/json.",
                    )
        except APIError as error:
            headers = {"WWW-Authenticate": "Bearer"} if error.status == 401 else None
            await error_response(error, headers)(scope, receive, send)
            return

        async def private_send(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = [
                    (name, value)
                    for name, value in message.get("headers", [])
                    if name.lower() != b"cache-control"
                ]
                message = {
                    **message,
                    "headers": [*headers, (b"cache-control", b"private, no-store")],
                }
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
