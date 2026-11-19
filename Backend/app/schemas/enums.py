"""Stable string vocabularies shared by API validation and matching."""

from enum import StrEnum


class EducationLevel(StrEnum):
    HIGH_SCHOOL = "high_school"
    DIPLOMA = "diploma"
    BACHELOR = "bachelor"
    MASTER = "master"
    DOCTORATE = "doctorate"


class LanguageLevel(StrEnum):
    BASIC = "basic"
    CONVERSATIONAL = "conversational"
    PROFESSIONAL = "professional"
    NATIVE = "native"


class WorkAuthorisationStatus(StrEnum):
    UNKNOWN = "unknown"
    CITIZEN = "citizen"
    PERMANENT_RESIDENT = "permanent_resident"
    WORK_PERMIT = "work_permit"
    STUDENT_VISA = "student_visa"
    REQUIRES_SPONSORSHIP = "requires_sponsorship"
    NOT_AUTHORISED = "not_authorised"


class OpportunityType(StrEnum):
    JOB = "job"
    INTERNSHIP = "internship"


class WorkMode(StrEnum):
    ONSITE = "onsite"
    HYBRID = "hybrid"
    REMOTE = "remote"


class ExperienceLevel(StrEnum):
    INTERNSHIP = "internship"
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"


class Severity(StrEnum):
    CRITICAL = "critical"
    VERIFY = "verify"
    INFO = "info"


class CriterionStatus(StrEnum):
    MET = "met"
    PARTIAL = "partial"
    UNMET = "unmet"
    UNKNOWN = "unknown"


class MatchLabel(StrEnum):
    STRONG = "strong"
    PARTIAL = "partial"
    WEAK = "weak"
    NOT_RECOMMENDED = "not_recommended"
    INSUFFICIENT_DATA = "insufficient_data"
