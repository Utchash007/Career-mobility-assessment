"""Assemble five criterion results, normalize known weights and rank deterministically."""

from app.schemas.match import MatchResult
from app.schemas.opportunity import OpportunitySummary
from app.schemas.profile import ProfileWrite
from app.services.matcher.common import MATCHER_VERSION
from app.services.matcher.education import score_education
from app.services.matcher.eligibility import eligibility_flags
from app.services.matcher.experience import score_experience
from app.services.matcher.language import score_language
from app.services.matcher.location import score_location
from app.services.matcher.skills import score_skills


def evaluate(profile: ProfileWrite, opportunity: OpportunitySummary) -> MatchResult:
    language, language_flags = score_language(profile, opportunity)
    criteria = [score_skills(profile, opportunity), language, score_experience(profile, opportunity),
                score_education(profile, opportunity), score_location(profile, opportunity)]
    flags = [*eligibility_flags(profile, opportunity), *language_flags]
    known = [item for item in criteria if item.score is not None]
    denominator = sum(item.weight for item in known)
    score = round(100 * sum(item.weight * item.score for item in known) / denominator, 1) if denominator else None
    if any(flag.severity == "critical" for flag in flags):
        label = "not_recommended"
    elif score is None:
        label = "insufficient_data"
    else:
        label = "strong" if score >= 75 else "partial" if score >= 50 else "weak"
    return MatchResult(opportunity_id=opportunity.id, slug=opportunity.slug, title=opportunity.title,
                       overall_score=score, label=label, criteria=criteria, flags=flags,
                       criteria_evaluated=len(known), matcher_version=MATCHER_VERSION)


def ranking_key(match: MatchResult) -> tuple[bool, bool, float, int, int]:
    return (any(flag.severity == "critical" for flag in match.flags), match.overall_score is None,
            -(match.overall_score or 0), -match.criteria_evaluated, match.opportunity_id)
