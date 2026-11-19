"""Structured seed and read contracts for opportunities."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import Field, StrictBool, StrictInt, StringConstraints, field_validator, model_validator

from app.core.normalise import country_code, language_code, skill_key, unique_keys
from app.schemas.common import DTO, Text
from app.schemas.enums import EducationLevel, ExperienceLevel, LanguageLevel, OpportunityType, Severity, WorkMode


class EducationRequirement(DTO):
    min_level: EducationLevel
    related_fields: list[str] = Field(default_factory=list)

    @field_validator("related_fields", mode="before")
    @classmethod
    def normalize_fields(cls, value: object) -> list[str]:
        return unique_keys(value)


class EducationRequirements(DTO):
    required: EducationRequirement | None = None
    preferred: EducationRequirement | None = None


class OpportunityLanguage(DTO):
    language: str
    min_level: LanguageLevel
    required: StrictBool

    @field_validator("language", mode="before")
    @classmethod
    def normalize_language(cls, value: object) -> str:
        return language_code(value)


class WorkAuthorisationParams(DTO):
    country: str | None = None
    sponsorship: StrictBool | None = None

    @field_validator("country", mode="before")
    @classmethod
    def normalize_country(cls, value: object) -> str | None:
        return None if value is None else country_code(value)


class EmptyParams(DTO):
    pass


class LicenceParams(DTO):
    licence_type: Text


class RequirementBase(DTO):
    label: Annotated[str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=200)]
    severity: Severity


class WorkAuthorisationRequirement(RequirementBase):
    code: Literal["work_authorisation"]
    params: WorkAuthorisationParams


class EnrolmentRequirement(RequirementBase):
    code: Literal["enrolment"]
    params: EmptyParams


class LicenceRequirement(RequirementBase):
    code: Literal["licence"]
    params: LicenceParams


class OtherRequirement(RequirementBase):
    code: Literal["other"]
    params: EmptyParams


type EligibilityRequirement = Annotated[
    WorkAuthorisationRequirement | EnrolmentRequirement | LicenceRequirement | OtherRequirement,
    Field(discriminator="code"),
]


class OpportunityFields(DTO):
    slug: Annotated[str, StringConstraints(strict=True, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    title: Text
    organisation: Text
    country: str | None
    city: Text | None = None
    type: OpportunityType
    experience_level: ExperienceLevel
    min_years: Annotated[StrictInt, Field(ge=0, le=60)] = 0
    max_years: Annotated[StrictInt, Field(ge=0, le=60)] | None = None
    required_skills: list[str] = Field(default_factory=list, max_length=30)
    preferred_skills: list[str] = Field(default_factory=list, max_length=30)
    education_requirements: EducationRequirements = Field(default_factory=EducationRequirements)
    languages: list[OpportunityLanguage] = Field(default_factory=list, max_length=5)
    eligibility_requirements: list[EligibilityRequirement] = Field(default_factory=list, max_length=10)
    work_mode: WorkMode = WorkMode.ONSITE

    @field_validator("country", mode="before")
    @classmethod
    def normalize_country(cls, value: object) -> str | None:
        return None if value is None else country_code(value)

    @field_validator("required_skills", "preferred_skills", mode="before")
    @classmethod
    def normalize_skills(cls, value: object) -> list[str]:
        return unique_keys(value, skill_key)

    @model_validator(mode="after")
    def consistent_requirements(self) -> "OpportunityFields":
        if self.max_years is not None and self.max_years < self.min_years:
            raise ValueError("Maximum experience cannot be below minimum experience.")
        if self.country is None and self.work_mode != WorkMode.REMOTE:
            raise ValueError("Only a global remote opportunity can omit the country.")
        if self.work_mode == WorkMode.ONSITE and not self.city:
            raise ValueError("Onsite opportunities require a city.")
        if len({item.language for item in self.languages}) != len(self.languages):
            raise ValueError("Opportunity languages must be unique.")
        return self


class OpportunitySeed(OpportunityFields):
    description: Text


class OpportunitySummary(OpportunityFields):
    id: int = Field(gt=0)
    is_shortlisted: bool


class OpportunityRead(OpportunitySummary):
    description: str
    created_at: datetime
    updated_at: datetime
