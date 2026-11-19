"""Delete only application data, reporting actual removals atomically."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.me import delete_owned_data
from app.db.repositories.profile import find_profile
from app.schemas.me import DataDeletionResponse


async def delete_data(session: AsyncSession, user_id: str) -> DataDeletionResponse:
    async with session.begin():
        profile = await find_profile(session, user_id, lock=True)
        if profile is None:
            return DataDeletionResponse(profile_deleted=False, shortlist_deleted=0)
        deleted, saved_count = await delete_owned_data(session, user_id)
        return DataDeletionResponse(profile_deleted=deleted, shortlist_deleted=saved_count)
