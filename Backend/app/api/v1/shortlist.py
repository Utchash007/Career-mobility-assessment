"""Saved-opportunity routes expose no saved-row or caller-selected user ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.api.dependencies import SessionDependency
from app.api.queries import no_query_parameters, shortlist_query
from app.api.v1.opportunity import OpportunityID
from app.core.auth import UserDependency
from app.schemas.common import Page
from app.schemas.query import ShortlistQuery
from app.schemas.shortlist import ShortlistItem, ShortlistNoteUpdate, ShortlistSave
from app.services import shortlist as service

router = APIRouter(prefix="/shortlist", tags=["shortlist"])


@router.get("", response_model=Page[ShortlistItem])
async def get_shortlist(user: UserDependency, session: SessionDependency,
                        query: Annotated[ShortlistQuery, Depends(shortlist_query)]) -> Page[ShortlistItem]:
    return await service.list_shortlist(session, user.user_id, query)


@router.post("/{opportunity_id}", response_model=ShortlistItem, responses={201: {"model": ShortlistItem}}, dependencies=[Depends(no_query_parameters)])
async def save_opportunity(opportunity_id: OpportunityID, payload: ShortlistSave, response: Response,
                           user: UserDependency, session: SessionDependency) -> ShortlistItem:
    result, created = await service.save(session, user.user_id, opportunity_id, payload)
    response.status_code = 201 if created else 200
    return result


@router.patch("/{opportunity_id}", response_model=ShortlistItem, dependencies=[Depends(no_query_parameters)])
async def update_note(opportunity_id: OpportunityID, payload: ShortlistNoteUpdate,
                       user: UserDependency, session: SessionDependency) -> ShortlistItem:
    return await service.update_note(session, user.user_id, opportunity_id, payload.note)


@router.delete("/{opportunity_id}", status_code=204, dependencies=[Depends(no_query_parameters)])
async def remove_opportunity(opportunity_id: OpportunityID, user: UserDependency, session: SessionDependency) -> Response:
    await service.remove(session, user.user_id, opportunity_id)
    return Response(status_code=204)
