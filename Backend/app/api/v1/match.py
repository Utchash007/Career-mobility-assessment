"""Recommendation APIs use only the verified user's saved profile."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import SessionDependency
from app.api.queries import match_query, no_query_parameters
from app.api.v1.opportunity import OpportunityID
from app.core.auth import UserDependency
from app.schemas.common import Page
from app.schemas.match import MatchListItem, MatchResult
from app.schemas.query import MatchQuery
from app.services import match as service

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=Page[MatchListItem])
async def get_matches(
    user: UserDependency,
    session: SessionDependency,
    query: Annotated[MatchQuery, Depends(match_query)],
) -> Page[MatchListItem]:
    return await service.list_matches(session, user.user_id, query)


@router.get(
    "/{opportunity_id}", response_model=MatchResult, dependencies=[Depends(no_query_parameters)]
)
async def get_match(
    opportunity_id: OpportunityID, user: UserDependency, session: SessionDependency
) -> MatchResult:
    return await service.get_match(session, user.user_id, opportunity_id)
