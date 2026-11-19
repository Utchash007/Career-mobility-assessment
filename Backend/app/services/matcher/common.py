"""Versioned scoring constants and consistent criterion construction."""

from typing import Any

from app.schemas.enums import CriterionStatus, EducationLevel, LanguageLevel
from app.schemas.match import CriterionKey, CriterionResult

MATCHER_VERSION = "1.0.0"
WEIGHTS = {"skills": 0.30, "language": 0.20, "experience": 0.20, "education": 0.15, "location": 0.15}
EDUCATION_RANK = {level: index for index, level in enumerate(EducationLevel, 1)}
LANGUAGE_RANK = {level: index for index, level in enumerate(LanguageLevel, 1)}


def criterion(key: CriterionKey, score: float | None, reason: str, evidence: dict[str, Any]) -> CriterionResult:
    status = CriterionStatus.UNKNOWN if score is None else CriterionStatus.MET if score == 1 else CriterionStatus.UNMET if score == 0 else CriterionStatus.PARTIAL
    return CriterionResult(key=key, weight=WEIGHTS[key], score=score, status=status, reason=reason, evidence=evidence)
