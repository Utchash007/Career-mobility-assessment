"""Authenticated, read-only opportunity discovery; profiles are optional."""

from typing import Annotated

from fastapi import APIRouter, Depends, Path

from app.api.dependencies import SessionDependency
from app.api.queries import no_query_parameters, opportunity_query
from app.core.auth import UserDependency
from app.schemas.common import Page
from app.schemas.opportunity import OpportunityRead, OpportunitySummary
from app.schemas.query import OpportunityQuery
from app.services import opportunity as service

router = APIRouter(prefix="/opportunities", tags=["opportunities"])
type OpportunityID = Annotated[int, Path(gt=0, le=9223372036854775807)]


@router.get("", response_model=Page[OpportunitySummary])
async def get_opportunities(
    user: UserDependency,
    session: SessionDependency,
    query: Annotated[OpportunityQuery, Depends(opportunity_query)],
) -> Page[OpportunitySummary]:
    return await service.list_opportunities(session, user.user_id, query)


@router.get(
    "/{opportunity_id}", response_model=OpportunityRead, dependencies=[Depends(no_query_parameters)]
)
async def get_opportunity(
    opportunity_id: OpportunityID, user: UserDependency, session: SessionDependency
) -> OpportunityRead:
    return await service.get_opportunity(session, user.user_id, opportunity_id)
