"""Required education determines fit; preferred education is never a penalty."""

from app.core.normalise import field_group
from app.schemas.match import CriterionResult
from app.schemas.opportunity import OpportunitySummary
from app.schemas.profile import ProfileWrite
from app.services.matcher.common import EDUCATION_RANK, criterion


def score_education(profile: ProfileWrite, opportunity: OpportunitySummary) -> CriterionResult:
    required = opportunity.education_requirements.required
    actual = profile.education.level
    group = field_group(profile.education.field_of_study)
    evidence = {"actual_level": actual, "required_level": required.min_level if required else None,
                "actual_field_group": group, "related_fields": required.related_fields if required else [],
                "preferred": opportunity.education_requirements.preferred.model_dump(mode="json") if opportunity.education_requirements.preferred else None}
    if required is None:
        return criterion("education", 1.0, "No required education; any preferred education is informational.", evidence)
    if actual is None:
        return criterion("education", None, "Education level was not declared.", evidence)
    if EDUCATION_RANK[actual] < EDUCATION_RANK[required.min_level]:
        return criterion("education", 0.0, f"Declared {actual} level is below required {required.min_level}; this is a scored education gap.", evidence)
    if not required.related_fields:
        return criterion("education", 1.0, "Declared education meets the required level; any field is accepted.", evidence)
    if group is None:
        return criterion("education", None, "Declared level meets the requirement, but the field could not be mapped. Field relevance is unknown.", evidence)
    if group in required.related_fields:
        return criterion("education", 1.0, "Declared education meets the required level and related field.", evidence)
    return criterion("education", 0.5, "Declared level meets the requirement, but the field is outside the related groups.", evidence)
