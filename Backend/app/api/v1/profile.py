"""Thin profile endpoints; identity is supplied only by verified authentication."""

from fastapi import APIRouter, Depends, Response

from app.api.dependencies import SessionDependency
from app.api.queries import no_query_parameters
from app.core.auth import UserDependency
from app.schemas.profile import ProfileRead, ProfileWrite, SampleProfileRequest
from app.services import profile as service

router = APIRouter(prefix="/profile", tags=["profile"], dependencies=[Depends(no_query_parameters)])


@router.get("", response_model=ProfileRead)
async def get_profile(user: UserDependency, session: SessionDependency) -> ProfileRead:
    return await service.read_profile(session, user.user_id)


@router.put("", response_model=ProfileRead, responses={201: {"model": ProfileRead}})
async def put_profile(payload: ProfileWrite, response: Response, user: UserDependency, session: SessionDependency) -> ProfileRead:
    result, created = await service.save_profile(session, user.user_id, payload)
    response.status_code = 201 if created else 200
    return result


@router.post("/sample", response_model=ProfileRead, responses={201: {"model": ProfileRead}})
async def sample_profile(payload: SampleProfileRequest, response: Response, user: UserDependency, session: SessionDependency) -> ProfileRead:
    result, created = await service.save_sample(session, user.user_id)
    response.status_code = 201 if created else 200
    return result
