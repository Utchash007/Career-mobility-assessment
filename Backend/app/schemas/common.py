"""Common DTO configuration and collection envelopes."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Text = Annotated[str, StringConstraints(strict=True, strip_whitespace=True, min_length=1)]


class DTO(BaseModel):
    model_config = ConfigDict(extra="forbid", hide_input_in_errors=True, from_attributes=True)


class Pagination(DTO):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total: int = Field(ge=0)
    total_pages: int = Field(ge=0)
    has_next: bool
    has_previous: bool


class Page[T](DTO):
    items: list[T]
    pagination: Pagination


def pagination_for(page: int, page_size: int, total: int) -> Pagination:
    total_pages = (total + page_size - 1) // page_size
    return Pagination(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=1 < page <= total_pages,
    )
