"""Profile DTOs preserve unknown values instead of inventing answers."""

import re
from datetime import UTC, date, datetime
from typing import Annotated

from pydantic import (
    Field,
    StrictBool,
    StrictInt,
    StringConstraints,
    field_validator,
    model_validator,
)

from app.core.normalise import country_code, language_code, skill_key, unique_keys
from app.schemas.common import DTO
from app.schemas.enums import EducationLevel, LanguageLevel, WorkAuthorisationStatus


class Education(DTO):
    level: EducationLevel | None = None
    field_of_study: (
        Annotated[
            str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=120)
        ]
        | None
    ) = None
    is_enrolled: StrictBool | None = None


class ProfileLanguage(DTO):
    language: str
    level: LanguageLevel

    @field_validator("language", mode="before")
    @classmethod
    def normalize_language(cls, value: object) -> str:
        return language_code(value)


class WorkAuthorisation(DTO):
    status: WorkAuthorisationStatus = WorkAuthorisationStatus.UNKNOWN
    countries: list[str] = Field(default_factory=list)

    @field_validator("countries", mode="before")
    @classmethod
    def normalize_countries(cls, value: object) -> list[str]:
        return unique_keys(value, country_code)

    @model_validator(mode="after")
    def check_status_countries(self) -> "WorkAuthorisation":
        if (self.status == WorkAuthorisationStatus.UNKNOWN) != (not self.countries):
            raise ValueError("Unknown status needs no countries; a known status needs countries.")
        return self


class ProfileWrite(DTO):
    full_name: Annotated[
        str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=200)
    ]
    birthday: date | None = None
    education: Education = Field(default_factory=Education)
    experience_years: Annotated[StrictInt, Field(ge=0, le=60)] | None = None
    skills: list[str] = Field(default_factory=list, max_length=30)
    languages: list[ProfileLanguage] = Field(default_factory=list, max_length=10)
    preferred_locations: list[str] = Field(default_factory=list, max_length=10)
    career_interests: list[str] = Field(default_factory=list, max_length=15)
    work_authorisation: WorkAuthorisation = Field(default_factory=WorkAuthorisation)

    @field_validator("birthday", mode="before")
    @classmethod
    def date_only(cls, value: object) -> object:
        if value is None or type(value) is date:
            return value
        if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            raise ValueError("Use a date in YYYY-MM-DD format.")
        return value

    @field_validator("birthday")
    @classmethod
    def valid_birthday(cls, value: date | None) -> date | None:
        if value is not None and not date(1900, 1, 1) <= value <= datetime.now(UTC).date():
            raise ValueError("Birthday must be between 1900-01-01 and today.")
        return value

    @field_validator("skills", mode="before")
    @classmethod
    def normalize_skills(cls, value: object) -> list[str]:
        return unique_keys(value, skill_key)

    @field_validator("preferred_locations", mode="before")
    @classmethod
    def normalize_locations(cls, value: object) -> list[str]:
        return unique_keys(value, country_code)

    @field_validator("career_interests", mode="before")
    @classmethod
    def normalize_interests(cls, value: object) -> list[str]:
        return unique_keys(value)

    @field_validator("languages")
    @classmethod
    def unique_languages(cls, value: list[ProfileLanguage]) -> list[ProfileLanguage]:
        if len({item.language for item in value}) != len(value):
            raise ValueError("Declare each language only once.")
        return value


class ProfileRead(ProfileWrite):
    user_id: str
    created_at: datetime
    updated_at: datetime


class SampleProfileRequest(DTO):
    pass
