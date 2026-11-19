"""Read raw query pairs so duplicate/unsupported parameters cannot disappear."""

from fastapi import Request
from pydantic import ValidationError

from app.core.errors import APIError, validation_fields
from app.schemas.query import CollectionQuery, MatchQuery, OpportunityQuery, ShortlistQuery


def no_query_parameters(request: Request) -> None:
    if request.query_params:
        name = next(iter(request.query_params))
        raise APIError(422, "VALIDATION_ERROR", "This endpoint accepts no query parameters.", {name: "Remove this parameter."})


def parse_query[T: CollectionQuery](request: Request, schema: type[T]) -> T:
    values: dict[str, str] = {}
    for name, value in request.query_params.multi_items():
        if name in values or name not in schema.model_fields or not value.strip():
            raise APIError(422, "VALIDATION_ERROR", "Query parameters are invalid.", {name: "Use one non-empty supported parameter."})
        values[name] = value
    try:
        return schema.model_validate(values)
    except ValidationError as error:
        raise APIError(422, "VALIDATION_ERROR", "Query parameters are invalid.", validation_fields(error.errors())) from None


def opportunity_query(request: Request) -> OpportunityQuery:
    return parse_query(request, OpportunityQuery)


def match_query(request: Request) -> MatchQuery:
    return parse_query(request, MatchQuery)


def shortlist_query(request: Request) -> ShortlistQuery:
    return parse_query(request, ShortlistQuery)
