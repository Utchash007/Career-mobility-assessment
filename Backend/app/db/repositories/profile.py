"""Profile persistence; callers own the transaction."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Profile


async def find_profile(session: AsyncSession, user_id: str, *, lock: bool = False) -> Profile | None:
    statement = select(Profile).where(Profile.user_id == user_id)
    if lock:
        statement = statement.with_for_update()
    return await session.scalar(statement)


async def replace_profile(session: AsyncSession, user_id: str, values: dict[str, Any]) -> tuple[Profile, bool]:
    statement = insert(Profile).values(user_id=user_id, **values).on_conflict_do_nothing(
        index_elements=[Profile.user_id]
    ).returning(Profile)
    created = await session.scalar(statement)
    if created is not None:
        return created, True
    profile = await find_profile(session, user_id, lock=True)
    if profile is None:
        # A concurrent delete can win between a conflict and the subsequent lookup.
        from app.core.errors import APIError
        raise APIError(503, "SERVICE_UNAVAILABLE", "Profile changed concurrently. Please retry.")
    for name, value in values.items():
        if getattr(profile, name) != value:
            setattr(profile, name, value)
    await session.flush()
    await session.refresh(profile)
    return profile, False
