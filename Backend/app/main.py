"""FastAPI application factory with optional, lazy database resources."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.v1.router import router as application_router
from app.core.config import Settings, get_settings
from app.core.auth import AuthenticationBoundary
from app.core.errors import register_error_handlers
from app.db.session import Database


def create_app(settings: Settings | None = None) -> FastAPI:
    configuration = settings if settings is not None else get_settings()
    database = Database(configuration)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        # No network activity on startup, even when DATABASE_URL is configured.
        try:
            yield
        finally:
            await database.dispose()

    app = FastAPI(
        title="Panama Assessment Backend",
        version="0.1.0",
        description="Setup scaffold only. Health is liveness, not database readiness.",
        lifespan=lifespan,
    )
    app.state.settings = configuration
    app.state.database = database
    register_error_handlers(app)
    app.add_middleware(AuthenticationBoundary, settings=configuration)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=configuration.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "PUT", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(health_router)
    app.include_router(application_router)
    return app
