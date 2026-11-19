"""Deletion explicitly covers application data, not the Clerk account."""

from typing import Literal

from pydantic import Field

from app.schemas.common import DTO


class DataDeletionResponse(DTO):
    scope: Literal["application_data"] = "application_data"
    profile_deleted: bool
    shortlist_deleted: int = Field(ge=0)
    clerk_account_deleted: Literal[False] = False
