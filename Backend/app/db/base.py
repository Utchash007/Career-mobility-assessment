"""Empty metadata for future Alembic migrations; no schema implementation."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
