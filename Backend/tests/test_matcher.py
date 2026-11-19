"""Pure fictional matching evidence; no HTTP calls or database writes."""

import json

import pytest

from app.db.seed import load_seed
from app.schemas.opportunity import OpportunitySummary
from app.schemas.profile import ProfileWrite
from app.services.matcher import evaluate, ranking_key
from app.services.matcher.education import score_education
from app.services.matcher.eligibility import finding
from app.services.matcher.experience import score_experience
from app.services.matcher.language import score_language
from app.services.matcher.skills import score_skills
from app.services.profile import SAMPLE_PROFILE


@pytest.fixture
def demo() -> ProfileWrite:
    return ProfileWrite.model_validate(SAMPLE_PROFILE)


@pytest.fixture
def roles() -> list[OpportunitySummary]:
    return [
        OpportunitySummary(**row.model_dump(exclude={"description"}), id=i, is_shortlisted=False)
        for i, row in enumerate(load_seed(), 1)
    ]


@pytest.mark.parametrize(
    "index,label",
    [
        (0, "strong"),
        (1, "not_recommended"),
        (2, "not_recommended"),
        (3, "strong"),
        (4, "strong"),
        (5, "partial"),
        (6, "partial"),
        (7, "strong"),
        (8, "partial"),
        (9, "partial"),
        (10, "weak"),
        (11, "weak"),
    ],
)
def test_finalized_seed_scenarios(demo: ProfileWrite, roles: list, index: int, label: str) -> None:
    result = evaluate(demo, roles[index])
    assert result.label == label
    assert result.criteria_evaluated == 5
    assert [item.key for item in result.criteria] == [
        "skills",
        "language",
        "experience",
        "education",
        "location",
    ]
    assert result.matcher_version == "1.0.0"


def test_strong_match_formula_and_explanation(demo: ProfileWrite, roles: list) -> None:
    result = evaluate(demo, roles[0])
    assert result.overall_score == 95.2
    assert result.criteria[0].score == pytest.approx(0.84)
    assert result.criteria[0].evidence["missing"] == ["presentation"]
    assert [flag.severity for flag in result.flags] == ["verify"]


def test_all_unknown_and_critical_precedence(roles: list) -> None:
    unknown = ProfileWrite(full_name="Fictional")
    result = evaluate(unknown, roles[0])
    assert result.overall_score is None and result.label == "insufficient_data"
    assert result.criteria_evaluated == 0
    explicit = unknown.model_copy(
        update={
            "work_authorisation": ProfileWrite(
                full_name="Fictional",
                work_authorisation={"status": "not_authorised", "countries": ["DE"]},
            ).work_authorisation
        }
    )
    assert evaluate(explicit, roles[0]).label == "not_recommended"


def test_unknown_weights_are_renormalized(demo: ProfileWrite, roles: list) -> None:
    profile = demo.model_copy(update={"skills": []})
    result = evaluate(profile, roles[0])
    assert result.criteria[0].score is None
    assert result.criteria[0].weight == 0.3
    assert result.overall_score == 100
    assert result.criteria_evaluated == 4


def test_no_requirement_and_preferred_only_are_met(roles: list) -> None:
    role = roles[0].model_copy(
        update={
            "required_skills": [],
            "languages": [],
            "education_requirements": roles[9].education_requirements,
            "min_years": 0,
            "max_years": None,
        }
    )
    result = evaluate(ProfileWrite(full_name="Fictional"), role)
    assert [item.score for item in result.criteria] == [1, 1, 1, 1, None]


def test_missing_preference_does_not_penalize_required_overlap(
    demo: ProfileWrite, roles: list
) -> None:
    without_excel = demo.model_copy(
        update={"skills": [item for item in demo.skills if item != "excel"]}
    )
    assert score_skills(without_excel, roles[0]).score == 0.8
    assert score_skills(demo, roles[0]).score == pytest.approx(0.84)


@pytest.mark.parametrize(
    "years,expected", [(0, 0.6), (1, 1), (2, 1), (3, 0.6), (4, 0.3), (5, 0.2), (None, None)]
)
def test_experience_distance(
    demo: ProfileWrite, roles: list, years: int | None, expected: float | None
) -> None:
    result = score_experience(demo.model_copy(update={"experience_years": years}), roles[0])
    if expected is None:
        assert result.score is None
    else:
        assert result.score == pytest.approx(expected)


@pytest.mark.parametrize("years,expected", [(4, 0.6), (3, 0.3), (2, 0), (20, 1)])
def test_shortfall_and_unbounded_maximum(
    demo: ProfileWrite, roles: list, years: int, expected: float
) -> None:
    role = roles[0].model_copy(update={"min_years": 5, "max_years": None})
    assert (
        score_experience(demo.model_copy(update={"experience_years": years}), role).score
        == expected
    )


def test_education_unknown_field_and_preferred_master(roles: list) -> None:
    profile = ProfileWrite(
        full_name="Fictional",
        education={"level": "bachelor", "field_of_study": "Unmapped specialty"},
    )
    assert score_education(profile, roles[0]).score is None
    assert score_education(profile, roles[10]).score == 0
    assert score_education(profile, roles[9]).score == 1


def test_multiple_languages_and_hard_gap(demo: ProfileWrite, roles: list) -> None:
    profile = demo.model_copy(update={"languages": [demo.languages[1]]})
    criterion, flags = score_language(profile, roles[8])
    assert criterion.score == 0.5
    assert len(flags) == 1 and flags[0].severity == "critical"
    unknown, flags = score_language(ProfileWrite(full_name="Fictional"), roles[8])
    assert unknown.score is None and all(flag.severity == "verify" for flag in flags)


@pytest.mark.parametrize(
    "status,countries,sponsor,severity",
    [
        ("unknown", [], False, "verify"),
        ("requires_sponsorship", ["CA"], False, "critical"),
        ("requires_sponsorship", ["CA"], True, "verify"),
        ("requires_sponsorship", ["CA"], None, "verify"),
        ("citizen", ["CA"], False, "info"),
        ("student_visa", ["CA"], False, "verify"),
        ("not_authorised", ["CA"], False, "critical"),
        ("not_authorised", ["DE"], False, "verify"),
    ],
)
def test_work_authorisation_semantics(
    demo: ProfileWrite,
    roles: list,
    status: str,
    countries: list,
    sponsor: bool | None,
    severity: str,
) -> None:
    profile = ProfileWrite.model_validate(
        {**demo.model_dump(), "work_authorisation": {"status": status, "countries": countries}}
    )
    value = roles[3].model_dump()
    value["eligibility_requirements"][0]["params"]["sponsorship"] = sponsor
    role = OpportunitySummary.model_validate(value)
    flags = evaluate(profile, role).flags
    assert flags[0].severity == severity
    assert "verification" in flags[0].message


@pytest.mark.parametrize(
    "severity,state,effective",
    [
        ("critical", "unknown", "verify"),
        ("critical", "unmet", "critical"),
        ("verify", "unknown", "verify"),
        ("verify", "unmet", "info"),
        ("info", "unknown", "info"),
        ("info", "unmet", "info"),
    ],
)
def test_requirement_severity_mapping(severity: str, state: str, effective: str) -> None:
    assert finding("other", severity, state, "Fictional").severity == effective


def test_unsupported_requirement_stays_unknown(demo: ProfileWrite, roles: list) -> None:
    value = roles[0].model_dump()
    value["eligibility_requirements"] = [
        {
            "code": "licence",
            "label": "Driver licence",
            "severity": "critical",
            "params": {"licence_type": "driver"},
        }
    ]
    flags = evaluate(demo, OpportunitySummary.model_validate(value)).flags
    assert len(flags) == 1 and flags[0].severity == "verify"


def test_ranking_and_privacy_are_deterministic(demo: ProfileWrite, roles: list) -> None:
    results = [evaluate(demo, role) for role in roles]
    ranked = sorted(results, key=ranking_key)
    assert all(flag.severity != "critical" for item in ranked[:-2] for flag in item.flags)
    assert {item.opportunity_id for item in ranked[-2:]} == {2, 3}
    changed = demo.model_copy(
        update={"full_name": "Other fictional name", "birthday": None, "career_interests": []}
    )
    assert [evaluate(changed, role) for role in roles] == results
    evidence = json.dumps([result.model_dump(mode="json") for result in results])
    assert "1998-04-12" not in evidence and "Amina Rahman" not in evidence
    tied = ranked[0].model_copy(update={"opportunity_id": 99})
    assert ranking_key(ranked[0]) < ranking_key(tied)
    null = ranked[0].model_copy(update={"overall_score": None})
    assert ranking_key(null) > ranking_key(ranked[0])
