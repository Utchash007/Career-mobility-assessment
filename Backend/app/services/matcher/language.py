"""Aggregate required language proficiency and report hard gaps separately."""

from app.schemas.match import CriterionResult, EligibilityFlag
from app.schemas.opportunity import OpportunitySummary
from app.schemas.profile import ProfileWrite
from app.services.matcher.common import LANGUAGE_RANK, criterion


def score_language(
    profile: ProfileWrite, opportunity: OpportunitySummary
) -> tuple[CriterionResult, list[EligibilityFlag]]:
    actual = {item.language: item.level for item in profile.languages}
    evidence = {
        "requirements": [
            {
                "language": item.language,
                "actual_level": actual.get(item.language),
                "required_level": item.min_level,
                "required": item.required,
            }
            for item in opportunity.languages
        ]
    }
    required = [item for item in opportunity.languages if item.required]
    if not required:
        return criterion(
            "language",
            1.0,
            "No required languages; preferred languages are informational.",
            evidence,
        ), []
    if not actual:
        flags = [
            EligibilityFlag(
                code="language",
                severity="verify",
                message=(
                    f"Required {item.language} proficiency was not declared. Requires verification."
                ),
            )
            for item in required
        ]
        return criterion(
            "language",
            None,
            "Languages were not declared; required proficiency needs verification.",
            evidence,
        ), flags
    scores, flags = [], []
    for item in required:
        level = actual.get(item.language)
        score = (
            min(1.0, LANGUAGE_RANK[level] / LANGUAGE_RANK[item.min_level])
            if level is not None
            else 0.0
        )
        scores.append(score)
        if score < 1:
            flags.append(
                EligibilityFlag(
                    code="language",
                    severity="critical",
                    message=(
                        f"Declared languages do not meet required {item.language} "
                        f"at {item.min_level} level."
                    ),
                )
            )
    return criterion(
        "language",
        sum(scores) / len(scores),
        f"{sum(score == 1 for score in scores)} of {len(scores)} required languages "
        "meet the stated level; preferred languages do not lower the score.",
        evidence,
    ), flags
