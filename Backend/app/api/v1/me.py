"""Application-data-only deletion; does not delete or revoke the Clerk identity."""

from fastapi import APIRouter, Depends

from app.api.dependencies import SessionDependency
from app.api.queries import no_query_parameters
from app.core.auth import UserDependency
from app.schemas.me import DataDeletionResponse
from app.services.me import delete_data

router = APIRouter(prefix="/me", tags=["privacy"], dependencies=[Depends(no_query_parameters)])


@router.delete("", response_model=DataDeletionResponse)
async def delete_my_data(user: UserDependency, session: SessionDependency) -> DataDeletionResponse:
    return await delete_data(session, user.user_id)
