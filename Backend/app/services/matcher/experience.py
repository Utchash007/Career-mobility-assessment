"""Explicit range-distance scoring; null and zero are different answers."""

from app.schemas.match import CriterionResult
from app.schemas.opportunity import OpportunitySummary
from app.schemas.profile import ProfileWrite
from app.services.matcher.common import criterion


def score_experience(profile: ProfileWrite, opportunity: OpportunitySummary) -> CriterionResult:
    years, minimum, maximum = profile.experience_years, opportunity.min_years, opportunity.max_years
    evidence = {"actual_years": years, "min_years": minimum, "max_years": maximum}
    if minimum == 0 and maximum is None:
        return criterion("experience", 1.0, "No experience range restriction is stated.", evidence)
    if years is None:
        return criterion("experience", None, "Years of experience were not stated.", evidence)
    if years < minimum:
        distance = minimum - years
        score = 0.6 if distance == 1 else 0.3 if distance == 2 else 0.0
        reason = f"{years} years is {distance} year(s) below the stated minimum of {minimum}."
    elif maximum is not None and years > maximum:
        distance = years - maximum
        score = 0.6 / distance
        reason = (
            f"{years} years is {distance} year(s) above the stated maximum of {maximum}; "
            "this is a range-fit gap, not an eligibility rejection."
        )
    else:
        score = 1.0
        reason = (
            f"{years} years meets the stated range: minimum {minimum}, "
            f"maximum {maximum if maximum is not None else 'unbounded'}."
        )
    return criterion("experience", score, reason, evidence)
