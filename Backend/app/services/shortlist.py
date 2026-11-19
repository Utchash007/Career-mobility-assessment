"""Profile-locked transactions serialize a user's saves, notes and deletion."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.db.models import Opportunity, Shortlist
from app.db.repositories import shortlist as repository
from app.db.repositories.opportunity import find_opportunity
from app.db.repositories.profile import find_profile
from app.schemas.common import Page, pagination_for
from app.schemas.query import ShortlistQuery
from app.schemas.shortlist import ShortlistItem, ShortlistSave
from app.services.opportunity import summary


async def lock_owner(session: AsyncSession, user_id: str) -> None:
    if await find_profile(session, user_id, lock=True) is None:
        raise APIError(409, "PROFILE_REQUIRED", "Create a profile before using the shortlist.")


def saved_item(saved: Shortlist, opportunity: Opportunity) -> ShortlistItem:
    return ShortlistItem(
        opportunity_id=opportunity.id,
        opportunity=summary(opportunity, True),
        note=saved.note,
        created_at=saved.created_at,
        updated_at=saved.updated_at,
    )


async def list_shortlist(
    session: AsyncSession, user_id: str, query: ShortlistQuery
) -> Page[ShortlistItem]:
    async with session.begin():
        await lock_owner(session, user_id)
        rows = await repository.list_saved(session, user_id, query)
        start = (query.page - 1) * query.page_size
        return Page[ShortlistItem](
            items=[
                saved_item(saved, opportunity)
                for saved, opportunity in rows[start : start + query.page_size]
            ],
            pagination=pagination_for(query.page, query.page_size, len(rows)),
        )


async def save(
    session: AsyncSession, user_id: str, opportunity_id: int, payload: ShortlistSave
) -> tuple[ShortlistItem, bool]:
    async with session.begin():
        await lock_owner(session, user_id)
        row = await find_opportunity(session, user_id, opportunity_id)
        if row is None:
            raise APIError(404, "OPPORTUNITY_NOT_FOUND", "Opportunity was not found.")
        opportunity, _saved = row
        saved = await repository.add_saved(session, user_id, opportunity_id, payload.note)
        created = saved is not None
        if saved is None:
            saved = await repository.find_saved(session, user_id, opportunity_id)
            if saved is None:
                raise APIError(
                    503, "SERVICE_UNAVAILABLE", "Saved state changed concurrently. Please retry."
                )
            if "note" in payload.model_fields_set:
                await repository.change_note(session, saved, payload.note)
        return saved_item(saved, opportunity), created


async def update_note(
    session: AsyncSession, user_id: str, opportunity_id: int, note: str
) -> ShortlistItem:
    async with session.begin():
        await lock_owner(session, user_id)
        saved = await repository.find_saved(session, user_id, opportunity_id)
        if saved is None:
            raise APIError(
                404, "SHORTLIST_ITEM_NOT_FOUND", "This opportunity is not in your shortlist."
            )
        row = await find_opportunity(session, user_id, opportunity_id)
        if row is None:
            raise APIError(
                404, "SHORTLIST_ITEM_NOT_FOUND", "This opportunity is not in your shortlist."
            )
        await repository.change_note(session, saved, note)
        return saved_item(saved, row[0])


async def remove(session: AsyncSession, user_id: str, opportunity_id: int) -> None:
    async with session.begin():
        await lock_owner(session, user_id)
        await repository.remove_saved(session, user_id, opportunity_id)
