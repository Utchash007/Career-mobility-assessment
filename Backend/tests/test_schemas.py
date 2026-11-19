"""Contract tests are in-memory; no database profile or real user is created."""

import base64
from datetime import date

import pytest
from pydantic import ValidationError
from starlette.requests import Request

from app.api.queries import parse_query
from app.core.config import Settings
from app.core.errors import APIError, validation_fields
from app.db.seed import load_seed
from app.schemas.common import pagination_for
from app.schemas.opportunity import OpportunitySeed
from app.schemas.profile import ProfileWrite
from app.schemas.query import MatchQuery, OpportunityQuery, ShortlistQuery
from app.schemas.shortlist import ShortlistNoteUpdate, ShortlistSave


def test_profile_defaults_and_aliases() -> None:
    value = ProfileWrite(
        full_name=" Fictional ",
        skills=["MS Excel", "excel", "Project Coordination"],
        languages=[{"language": "Bangla", "level": "native"}],
        preferred_locations=["Germany", "DE"],
    )
    assert value.full_name == "Fictional"
    assert value.skills == ["excel", "project_coordination"]
    assert value.preferred_locations == ["DE"]
    assert value.languages[0].language == "bn"
    assert value.experience_years is None
    assert value.education.is_enrolled is None


@pytest.mark.parametrize(
    "patch",
    [
        {"user_id": "not-allowed"},
        {"full_name": " "},
        {"full_name": "a" * 201},
        {"birthday": "1899-12-31"},
        {"birthday": "2999-01-01"},
        {"birthday": "2024-02-30"},
        {"birthday": "1998-04-12T00:00:00Z"},
        {"birthday": 0},
        {"experience_years": -1},
        {"experience_years": 61},
        {"experience_years": True},
        {"experience_years": "2"},
        {"skills": None},
        {"skills": ["a" * 61]},
        {"skills": [f"skill_{i}" for i in range(31)]},
        {"languages": [{"language": "en", "level": "professional"}] * 2},
        {"languages": [{"language": "xx", "level": "basic"}]},
        {"education": {"is_enrolled": "false"}},
        {"education": {"extra": "secret"}},
        {"work_authorisation": {"status": "unknown", "countries": ["DE"]}},
        {"work_authorisation": {"status": "citizen", "countries": []}},
        {"work_authorisation": {"status": "unknown", "extra": "secret"}},
    ],
)
def test_invalid_profile_fields(patch: dict) -> None:
    with pytest.raises(ValidationError):
        ProfileWrite.model_validate({"full_name": "Fictional", **patch})


def test_explicit_zero_false_and_date_are_preserved() -> None:
    profile = ProfileWrite(
        full_name="Fictional",
        birthday="1998-04-12",
        experience_years=0,
        education={"is_enrolled": False},
    )
    assert profile.birthday == date(1998, 4, 12)
    assert profile.experience_years == 0
    assert profile.education.is_enrolled is False


@pytest.mark.parametrize(
    "query",
    [
        "page=0",
        "page_size=101",
        "page=1.0",
        "page=-1",
        "page=true",
        "page=",
        "q=+++",
        "page=1&page=2",
        "user_id=x",
        "type=JOB",
        "country=de",
        "sort=score_desc",
    ],
)
def test_raw_query_rejection(query: str) -> None:
    request = Request({"type": "http", "query_string": query.encode(), "headers": []})
    with pytest.raises(APIError) as error:
        parse_query(request, OpportunityQuery)
    assert error.value.status == 422


@pytest.mark.parametrize("schema", [OpportunityQuery, MatchQuery, ShortlistQuery])
def test_query_defaults(schema: type) -> None:
    value = parse_query(Request({"type": "http", "query_string": b"", "headers": []}), schema)
    assert (value.page, value.page_size) == (1, 10)


@pytest.mark.parametrize(
    "page,size,total,next_,previous",
    [
        (1, 10, 0, False, False),
        (1, 10, 12, True, False),
        (2, 10, 12, False, True),
        (3, 10, 12, False, False),
    ],
)
def test_pagination_boundaries(
    page: int, size: int, total: int, next_: bool, previous: bool
) -> None:
    result = pagination_for(page, size, total)
    assert result.has_next is next_
    assert result.has_previous is previous
    assert result.total_pages == (total + size - 1) // size


@pytest.mark.parametrize("payload", [{"note": None}, {"note": "x" * 501}, {"user_id": "x"}])
def test_note_rejection(payload: dict) -> None:
    with pytest.raises(ValidationError):
        ShortlistSave.model_validate(payload)


def test_note_omission_and_explicit_empty_are_distinct() -> None:
    assert "note" not in ShortlistSave().model_fields_set
    assert "note" in ShortlistSave(note="").model_fields_set
    assert ShortlistNoteUpdate(note="").note == ""
    with pytest.raises(ValidationError):
        ShortlistNoteUpdate.model_validate({})


def test_seed_validity_and_constraints() -> None:
    rows = load_seed()
    assert len(rows) == 12
    assert len({row.slug for row in rows}) == 12
    assert all("Fictional" in row.description or "fictional" in row.description for row in rows)
    assert rows[7].country is None and not rows[7].eligibility_requirements
    assert rows[2].languages[0].language == "de" and rows[2].languages[0].required
    assert not rows[5].languages[1].required


@pytest.mark.parametrize(
    "patch",
    [
        {
            "education_requirements": {
                "required": {"min_level": "bachelor", "related_fields": ["not_a_group"]}
            }
        },
        {"min_years": 5, "max_years": 4},
        {"country": None},
        {"languages": [{"language": "en", "min_level": "basic", "required": True, "extra": "x"}]},
    ],
)
def test_seed_nested_validation(patch: dict) -> None:
    value = load_seed()[0].model_dump(mode="json")
    with pytest.raises(ValidationError):
        OpportunitySeed.model_validate({**value, **patch})


def test_trusted_issuer_from_publishable_configuration() -> None:
    encoded = base64.b64encode(b"fictional.clerk.accounts.dev$").decode()
    settings = Settings(_env_file=None, next_public_clerk_publishable_key="pk_test_" + encoded)
    assert settings.trusted_clerk_issuer == "https://fictional.clerk.accounts.dev"


@pytest.mark.parametrize(
    "host",
    [
        "attacker@trusted.example$",
        "trusted.example/path$",
        "trusted.example?query$",
        "trusted.example",
        "not a host$",
    ],
)
def test_invalid_publishable_domain_does_not_become_trusted(host: str) -> None:
    encoded = base64.b64encode(host.encode()).decode()
    assert (
        Settings(
            _env_file=None, next_public_clerk_publishable_key="pk_test_" + encoded
        ).trusted_clerk_issuer
        is None
    )


def test_error_fields_never_echo_custom_exception_or_invalid_tag() -> None:
    fields = validation_fields(
        [
            {
                "loc": ("body", "education", "level"),
                "type": "value_error",
                "msg": "credential-secret",
            },
            {"loc": ("body", "requirement"), "type": "union_tag_invalid", "msg": "token-secret"},
        ]
    )
    assert "secret" not in str(fields)
    assert "education.level" in fields
