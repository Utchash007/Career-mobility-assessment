"""One logical collection read with owner-specific saved state."""

from sqlalchemy import exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Opportunity, Shortlist
from app.schemas.query import CollectionQuery


def opportunity_filters(query: CollectionQuery) -> list:
    filters = []
    if query.q is not None:
        filters.append(or_(Opportunity.title.icontains(query.q, autoescape=True), Opportunity.organisation.icontains(query.q, autoescape=True)))
    for field in ("country", "type", "work_mode"):
        value = getattr(query, field)
        if value is not None:
            filters.append(getattr(Opportunity, field) == value)
    return filters


def saved_state(user_id: str):
    return exists().where(Shortlist.user_id == user_id, Shortlist.opportunity_id == Opportunity.id).label("is_shortlisted")


async def list_opportunities(session: AsyncSession, user_id: str, query: CollectionQuery) -> list[tuple[Opportunity, bool]]:
    statement = select(Opportunity, saved_state(user_id)).where(*opportunity_filters(query))
    sort = getattr(query, "sort", "id_asc")
    if sort == "title_asc":
        statement = statement.order_by(func.lower(Opportunity.title), Opportunity.id)
    elif sort == "title_desc":
        statement = statement.order_by(func.lower(Opportunity.title).desc(), Opportunity.id)
    else:
        statement = statement.order_by(Opportunity.id)
    return [(row[0], row[1]) for row in (await session.execute(statement)).all()]


async def find_opportunity(session: AsyncSession, user_id: str, opportunity_id: int) -> tuple[Opportunity, bool] | None:
    row = (await session.execute(select(Opportunity, saved_state(user_id)).where(Opportunity.id == opportunity_id))).first()
    return (row[0], row[1]) if row is not None else None
