"""Data-driven eligibility findings; self-declarations are never legal conclusions."""

from app.schemas.enums import Severity
from app.schemas.match import EligibilityFlag
from app.schemas.opportunity import OpportunitySummary
from app.schemas.profile import ProfileWrite


def finding(code: str, severity: Severity, state: str, message: str) -> EligibilityFlag:
    effective = (
        Severity.INFO
        if severity == Severity.INFO or state == "met"
        else Severity.VERIFY
        if state == "unknown"
        else Severity.CRITICAL
        if severity == Severity.CRITICAL
        else Severity.INFO
    )
    return EligibilityFlag(code=code, severity=effective, message=message)


def eligibility_flags(
    profile: ProfileWrite, opportunity: OpportunitySummary
) -> list[EligibilityFlag]:
    flags = []
    for requirement in opportunity.eligibility_requirements:
        if requirement.code == "work_authorisation":
            country = requirement.params.country
            declaration = profile.work_authorisation
            status = declaration.status if country in declaration.countries else "unknown"
            prefix = f"Work authorisation for {country or 'an unspecified hiring country'}"
            if status in {"citizen", "permanent_resident", "work_permit"}:
                state, message = (
                    "met",
                    f"{prefix} is self-declared as {status}. "
                    "Self-declared — requires verification; not a legal determination.",
                )
            elif status == "not_authorised":
                state, message = (
                    "unmet",
                    f"{prefix} was explicitly declared unavailable. "
                    "Requires verification; not a legal determination.",
                )
            elif status == "requires_sponsorship" and requirement.params.sponsorship is False:
                state, message = (
                    "unmet",
                    f"{prefix} requires sponsorship, but this opportunity cannot sponsor. "
                    "Requires verification.",
                )
            elif status == "requires_sponsorship":
                state, message = (
                    "unknown",
                    f"{prefix} requires sponsorship; "
                    "availability and eligibility require verification.",
                )
            elif status == "student_visa":
                state, message = (
                    "unknown",
                    f"{prefix} was declared as a student visa; work limits require verification.",
                )
            else:
                state, message = (
                    "unknown",
                    f"{prefix} was not provided for this country. Requires verification.",
                )
            flags.append(finding(requirement.code, requirement.severity, state, message))
        elif requirement.code == "enrolment":
            enrolled = profile.education.is_enrolled
            if enrolled is True:
                continue
            state = "unknown" if enrolled is None else "unmet"
            message = (
                "Current enrolment was not stated. Requires verification."
                if enrolled is None
                else "Current enrolment is required, but the profile declares not enrolled."
            )
            flags.append(finding(requirement.code, requirement.severity, state, message))
        else:
            flags.append(
                finding(
                    requirement.code,
                    requirement.severity,
                    "unknown",
                    f"{requirement.label}: no supporting declaration is collected by this profile. "
                    "Requires verification.",
                )
            )
    return flags
