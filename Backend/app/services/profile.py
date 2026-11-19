"""Current-user profile read, complete replacement and fictional sample loading."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.db.repositories.profile import find_profile, replace_profile
from app.schemas.profile import ProfileRead, ProfileWrite

SAMPLE_PROFILE = {
    "full_name": "Amina Rahman",
    "birthday": "1998-04-12",
    "education": {
        "level": "bachelor",
        "field_of_study": "Business Administration",
        "is_enrolled": False,
    },
    "experience_years": 2,
    "skills": [
        "excel",
        "research",
        "stakeholder_communication",
        "reporting",
        "project_coordination",
    ],
    "languages": [
        {"language": "bn", "level": "native"},
        {"language": "en", "level": "professional"},
    ],
    "preferred_locations": ["DE", "CA", "SG"],
    "career_interests": ["programme_support", "business_operations", "project_coordination"],
    "work_authorisation": {"status": "unknown", "countries": []},
}


async def read_profile(session: AsyncSession, user_id: str) -> ProfileRead:
    profile = await find_profile(session, user_id)
    if profile is None:
        raise APIError(404, "PROFILE_NOT_FOUND", "Create a profile to get started.")
    return ProfileRead.model_validate(profile)


async def save_profile(
    session: AsyncSession, user_id: str, payload: ProfileWrite
) -> tuple[ProfileRead, bool]:
    values = payload.model_dump(mode="json")
    values["birthday"] = payload.birthday
    values["education"] = payload.education.model_dump(mode="json", exclude_unset=True)
    async with session.begin():
        profile, created = await replace_profile(session, user_id, values)
        result = ProfileRead.model_validate(profile)
    return result, created


async def save_sample(session: AsyncSession, user_id: str) -> tuple[ProfileRead, bool]:
    return await save_profile(session, user_id, ProfileWrite.model_validate(SAMPLE_PROFILE))
