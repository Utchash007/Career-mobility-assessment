"""Request-scoped async persistence, with no implicit writes or commits."""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import APIError


def request_settings(request: Request) -> Settings:
    return request.app.state.settings


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    if request.app.state.settings.database_url is None:
        raise APIError(503, "SERVICE_UNAVAILABLE", "Database access is not configured.")
    async for session in request.app.state.database.sessions():
        yield session


type SessionDependency = Annotated[AsyncSession, Depends(get_session)]
