"""Serialize and page a single filtered collection snapshot (twelve-role prototype)."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.db.models import Opportunity
from app.db.repositories import opportunity as repository
from app.schemas.common import Page, pagination_for
from app.schemas.opportunity import OpportunityRead, OpportunitySummary
from app.schemas.query import OpportunityQuery


def summary(opportunity: Opportunity, saved: bool) -> OpportunitySummary:
    fields = {name: getattr(opportunity, name) for name in OpportunitySummary.model_fields if name != "is_shortlisted"}
    return OpportunitySummary.model_validate({**fields, "is_shortlisted": saved})


async def list_opportunities(session: AsyncSession, user_id: str, query: OpportunityQuery) -> Page[OpportunitySummary]:
    rows = await repository.list_opportunities(session, user_id, query)
    start = (query.page - 1) * query.page_size
    return Page[OpportunitySummary](
        items=[summary(row, saved) for row, saved in rows[start:start + query.page_size]],
        pagination=pagination_for(query.page, query.page_size, len(rows)),
    )


async def get_opportunity(session: AsyncSession, user_id: str, opportunity_id: int) -> OpportunityRead:
    row = await repository.find_opportunity(session, user_id, opportunity_id)
    if row is None:
        raise APIError(404, "OPPORTUNITY_NOT_FOUND", "Opportunity was not found.")
    opportunity, saved = row
    return OpportunityRead(**summary(opportunity, saved).model_dump(), description=opportunity.description,
                           created_at=opportunity.created_at, updated_at=opportunity.updated_at)
