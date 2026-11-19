"""Saved opportunities are addressed by opportunity ID, never saved-row ID."""

from datetime import datetime
from typing import Annotated

from pydantic import StringConstraints

from app.schemas.common import DTO
from app.schemas.opportunity import OpportunitySummary

type Note = Annotated[str, StringConstraints(strict=True, max_length=500)]


class ShortlistSave(DTO):
    note: Note = ""


class ShortlistNoteUpdate(DTO):
    note: Note


class ShortlistItem(DTO):
    opportunity_id: int
    opportunity: OpportunitySummary
    note: Note
    created_at: datetime
    updated_at: datetime
