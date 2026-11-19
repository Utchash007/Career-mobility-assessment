"""Required overlap plus a bounded preferred bonus, never a preference penalty."""

from app.schemas.match import CriterionResult
from app.schemas.opportunity import OpportunitySummary
from app.schemas.profile import ProfileWrite
from app.services.matcher.common import criterion


def score_skills(profile: ProfileWrite, opportunity: OpportunitySummary) -> CriterionResult:
    skills = set(profile.skills)
    required, preferred = opportunity.required_skills, opportunity.preferred_skills
    matched = [item for item in required if item in skills]
    missing = [item for item in required if item not in skills]
    preferred_matched = [item for item in preferred if item in skills]
    evidence = {"matched": matched, "missing": missing, "preferred_matched": preferred_matched,
                "preferred_missing": [item for item in preferred if item not in skills],
                "required_count": len(required), "declared": bool(skills)}
    if not required:
        return criterion("skills", 1.0, "No required skills; preferred skills are informational.", evidence)
    if not skills:
        return criterion("skills", None, "Skills were not declared; required overlap cannot be assessed.", evidence)
    overlap = len(matched) / len(required)
    bonus = 0.2 * (1 - overlap) * len(preferred_matched) / len(preferred) if preferred else 0.0
    return criterion("skills", overlap + bonus,
                     f"{len(matched)} of {len(required)} required skills and {len(preferred_matched)} of {len(preferred)} preferred skills matched.", evidence)
