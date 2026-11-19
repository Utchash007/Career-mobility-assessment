"""Every saved-row query is constrained by verified owner and opportunity ID."""

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Opportunity, Shortlist
from app.db.repositories.opportunity import opportunity_filters
from app.schemas.query import ShortlistQuery


async def list_saved(session: AsyncSession, user_id: str, query: ShortlistQuery) -> list[tuple[Shortlist, Opportunity]]:
    statement = select(Shortlist, Opportunity).join(Opportunity, Opportunity.id == Shortlist.opportunity_id).where(Shortlist.user_id == user_id, *opportunity_filters(query))
    if query.sort == "title_asc":
        statement = statement.order_by(func.lower(Opportunity.title), Opportunity.id)
    elif query.sort == "created_at_asc":
        statement = statement.order_by(Shortlist.created_at, Opportunity.id)
    else:
        statement = statement.order_by(Shortlist.created_at.desc(), Opportunity.id)
    return [(row[0], row[1]) for row in (await session.execute(statement)).all()]


async def find_saved(session: AsyncSession, user_id: str, opportunity_id: int) -> Shortlist | None:
    return await session.scalar(select(Shortlist).where(Shortlist.user_id == user_id, Shortlist.opportunity_id == opportunity_id))


async def add_saved(session: AsyncSession, user_id: str, opportunity_id: int, note: str) -> Shortlist | None:
    statement = insert(Shortlist).values(user_id=user_id, opportunity_id=opportunity_id, note=note).on_conflict_do_nothing(
        index_elements=[Shortlist.user_id, Shortlist.opportunity_id]
    ).returning(Shortlist)
    return await session.scalar(statement)


async def change_note(session: AsyncSession, saved: Shortlist, note: str) -> None:
    if saved.note != note:
        saved.note = note
        await session.flush()
        await session.refresh(saved)


async def remove_saved(session: AsyncSession, user_id: str, opportunity_id: int) -> None:
    await session.execute(delete(Shortlist).where(Shortlist.user_id == user_id, Shortlist.opportunity_id == opportunity_id))
