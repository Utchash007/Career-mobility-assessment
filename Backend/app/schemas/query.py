"""Endpoint-specific query models with strictly integer pagination."""

import re
from typing import Literal

from pydantic import Field, field_validator

from app.core.normalise import COUNTRY_CODES
from app.schemas.common import DTO
from app.schemas.enums import MatchLabel, OpportunityType, WorkMode


class CollectionQuery(DTO):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    q: str | None = Field(default=None, min_length=1, max_length=100)
    country: str | None = None
    type: OpportunityType | None = None
    work_mode: WorkMode | None = None

    @field_validator("page", "page_size", mode="before")
    @classmethod
    def integer_only(cls, value: object) -> object:
        if isinstance(value, str) and re.fullmatch(r"[0-9]+", value):
            return int(value)
        if type(value) is int:
            return value
        raise ValueError("Use an integer.")

    @field_validator("q", mode="before")
    @classmethod
    def trim_search(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("country")
    @classmethod
    def exact_country(cls, value: str | None) -> str | None:
        if value is not None and value not in COUNTRY_CODES:
            raise ValueError("Use an uppercase ISO alpha-2 country code.")
        return value


class OpportunityQuery(CollectionQuery):
    sort: Literal["id_asc", "title_asc", "title_desc"] = "id_asc"


class MatchQuery(CollectionQuery):
    label: MatchLabel | None = None


class ShortlistQuery(CollectionQuery):
    sort: Literal["created_at_desc", "created_at_asc", "title_asc"] = "created_at_desc"
