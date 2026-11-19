"""Safe, stable API errors without payloads, SQL or credentials."""

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException


class APIError(Exception):
    def __init__(self, status: int, code: str, message: str, fields: dict[str, str] | None = None):
        self.status = status
        self.code = code
        self.message = message
        self.fields = fields
        super().__init__(code)


def error_response(error: APIError, headers: dict[str, str] | None = None) -> JSONResponse:
    content: dict[str, Any] = {"code": error.code, "message": error.message}
    if error.fields:
        content["fields"] = error.fields
    return JSONResponse(
        status_code=error.status,
        content=content,
        headers={"Cache-Control": "private, no-store", **(headers or {})},
    )


def validation_fields(errors: list[dict[str, Any]]) -> dict[str, str]:
    fields: dict[str, str] = {}
    for item in errors:
        location = [str(part) for part in item.get("loc", ()) if part not in {"body", "query", "path"}]
        path = ".".join(location) or "body"
        # Never interpolate the raw input or exception text from validator contexts.
        if item.get("type") == "json_invalid":
            message = "Send valid JSON."
        elif item.get("type") in {"value_error", "union_tag_invalid", "union_tag_not_found"}:
            message = "Value is invalid or inconsistent with related fields."
        else:
            message = str(item.get("msg", "Value is invalid."))
        fields.setdefault(path, message)
    return fields


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIError)
    async def domain_error(_request: Request, error: APIError) -> JSONResponse:
        return error_response(error)

    @app.exception_handler(RequestValidationError)
    async def request_validation(_request: Request, error: RequestValidationError) -> JSONResponse:
        return error_response(APIError(422, "VALIDATION_ERROR", "Request is invalid.", validation_fields(error.errors())))

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, error: HTTPException) -> JSONResponse:
        codes = {401: "UNAUTHENTICATED", 403: "FORBIDDEN", 404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}
        return error_response(
            APIError(error.status_code, codes.get(error.status_code, "HTTP_ERROR"), "Request could not be completed."),
            error.headers,
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_error(_request: Request, _error: SQLAlchemyError) -> JSONResponse:
        return error_response(APIError(503, "SERVICE_UNAVAILABLE", "The service is temporarily unavailable. Please try again."))

    @app.exception_handler(Exception)
    async def unexpected_error(_request: Request, _error: Exception) -> JSONResponse:
        return error_response(APIError(500, "INTERNAL_ERROR", "An unexpected error occurred."))
