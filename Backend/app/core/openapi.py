"""Document raw query validation and safe errors without code generation."""

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from app.schemas.query import MatchQuery, OpportunityQuery, ShortlistQuery


def configure_openapi(app: FastAPI) -> None:
    def schema() -> dict:
        if app.openapi_schema is not None:
            return app.openapi_schema
        result = get_openapi(
            title=app.title, version=app.version, description=app.description, routes=app.routes
        )
        result["components"]["schemas"]["APIError"] = {
            "type": "object",
            "required": ["code", "message"],
            "properties": {
                "code": {"type": "string"},
                "message": {"type": "string"},
                "fields": {"type": "object", "additionalProperties": {"type": "string"}},
            },
        }
        queries = {
            "/api/v1/opportunities": OpportunityQuery,
            "/api/v1/matches": MatchQuery,
            "/api/v1/shortlist": ShortlistQuery,
        }
        for path, operations in result["paths"].items():
            if not path.startswith("/api/v1/"):
                continue
            for operation in operations.values():
                for status in ("401", "415", "422", "500", "503"):
                    operation["responses"][status] = {
                        "description": "Safe application error",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/APIError"}
                            }
                        },
                    }
                if path in queries:
                    query_schema = queries[path].model_json_schema(
                        ref_template="#/components/schemas/{model}"
                    )
                    result["components"]["schemas"].update(query_schema.pop("$defs", {}))
                    operation["parameters"] = [
                        {
                            "name": name,
                            "in": "query",
                            "required": False,
                            "description": (
                                "One value only; blanks, duplicates and unsupported "
                                "parameters are rejected."
                            ),
                            "schema": field,
                        }
                        for name, field in query_schema["properties"].items()
                    ]
                if path.startswith(("/api/v1/matches", "/api/v1/shortlist")):
                    operation["responses"]["409"] = {
                        "description": "PROFILE_REQUIRED",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/APIError"}
                            }
                        },
                    }
                if path.endswith("}") or path == "/api/v1/profile":
                    operation["responses"]["404"] = {
                        "description": "Requested resource not found",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/APIError"}
                            }
                        },
                    }
        app.openapi_schema = result
        return result

    app.openapi = schema
