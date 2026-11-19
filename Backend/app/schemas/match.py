"""Computed matching outputs; no persistence model is introduced."""

from typing import Annotated, Any, Literal

from pydantic import Field

from app.schemas.common import DTO
from app.schemas.enums import CriterionStatus, MatchLabel, Severity
from app.schemas.opportunity import OpportunitySummary

type CriterionKey = Literal["skills", "language", "experience", "education", "location"]


class CriterionResult(DTO):
    key: CriterionKey
    weight: float = Field(ge=0, le=1)
    score: Annotated[float, Field(ge=0, le=1)] | None
    status: CriterionStatus
    reason: str
    evidence: dict[str, Any]


class EligibilityFlag(DTO):
    code: str
    severity: Severity
    message: str


class MatchResult(DTO):
    opportunity_id: int = Field(gt=0)
    slug: str
    title: str
    overall_score: Annotated[float, Field(ge=0, le=100)] | None
    label: MatchLabel
    criteria: list[CriterionResult] = Field(min_length=5, max_length=5)
    flags: list[EligibilityFlag]
    criteria_evaluated: int = Field(ge=0, le=5)
    criteria_total: Literal[5] = 5
    matcher_version: str


class MatchListItem(DTO):
    opportunity: OpportunitySummary
    match: MatchResult
