"""Atomic deletion counting; no operation touches opportunities or Clerk."""

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Profile, Shortlist


async def delete_owned_data(session: AsyncSession, user_id: str) -> tuple[bool, int]:
    saved_ids = (
        await session.scalars(
            delete(Shortlist).where(Shortlist.user_id == user_id).returning(Shortlist.id)
        )
    ).all()
    deleted_user = await session.scalar(
        delete(Profile).where(Profile.user_id == user_id).returning(Profile.user_id)
    )
    return deleted_user is not None, len(saved_ids)
