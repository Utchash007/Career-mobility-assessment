"""Evaluate the complete filtered candidate set before label filtering and paging."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.db.repositories import opportunity as repository
from app.db.repositories.profile import find_profile
from app.schemas.common import Page, pagination_for
from app.schemas.match import MatchListItem, MatchResult
from app.schemas.profile import ProfileRead
from app.schemas.query import MatchQuery
from app.services.matcher import evaluate, ranking_key
from app.services.opportunity import summary


async def required_profile(session: AsyncSession, user_id: str) -> ProfileRead:
    profile = await find_profile(session, user_id)
    if profile is None:
        raise APIError(
            409, "PROFILE_REQUIRED", "Create a profile before requesting recommendations."
        )
    return ProfileRead.model_validate(profile)


async def list_matches(
    session: AsyncSession, user_id: str, query: MatchQuery
) -> Page[MatchListItem]:
    async with session.begin():
        profile = await required_profile(session, user_id)
        rows = await repository.list_opportunities(session, user_id, query)
        items = []
        for opportunity, saved in rows:
            opportunity_summary = summary(opportunity, saved)
            match = evaluate(profile, opportunity_summary)
            if query.label is None or query.label == match.label:
                items.append(MatchListItem(opportunity=opportunity_summary, match=match))
        items.sort(key=lambda item: ranking_key(item.match))
        start = (query.page - 1) * query.page_size
        return Page[MatchListItem](
            items=items[start : start + query.page_size],
            pagination=pagination_for(query.page, query.page_size, len(items)),
        )


async def get_match(session: AsyncSession, user_id: str, opportunity_id: int) -> MatchResult:
    async with session.begin():
        profile = await required_profile(session, user_id)
        row = await repository.find_opportunity(session, user_id, opportunity_id)
        if row is None:
            raise APIError(404, "OPPORTUNITY_NOT_FOUND", "Opportunity was not found.")
        opportunity, saved = row
        return evaluate(profile, summary(opportunity, saved))
