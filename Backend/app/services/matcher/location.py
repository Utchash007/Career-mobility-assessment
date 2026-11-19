"""Location preferences do not imply legal work authorization."""

from app.schemas.match import CriterionResult
from app.schemas.opportunity import OpportunitySummary
from app.schemas.profile import ProfileWrite
from app.services.matcher.common import criterion


def score_location(profile: ProfileWrite, opportunity: OpportunitySummary) -> CriterionResult:
    evidence = {"country": opportunity.country, "preferred_locations": profile.preferred_locations, "work_mode": opportunity.work_mode}
    if not profile.preferred_locations:
        return criterion("location", None, "Location preferences were not declared.", evidence)
    if opportunity.country in profile.preferred_locations:
        return criterion("location", 1.0, "The hiring country is a preferred location.", evidence)
    if opportunity.work_mode == "remote":
        return criterion("location", 0.7, "Remote work offers partial location fit outside the declared preferred countries; it does not establish work eligibility.", evidence)
    return criterion("location", 0.0, "The hiring country is not a preferred location.", evidence)
