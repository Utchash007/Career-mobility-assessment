"""Offline SQL/metadata checks: no database connections or user rows."""

from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from app.db.models import Opportunity, Profile, Shortlist
from app.db.repositories.opportunity import opportunity_filters, saved_state
from app.schemas.query import OpportunityQuery


def test_postgres_types_and_identity_generation() -> None:
    dialect = postgresql.dialect()
    profile = str(CreateTable(Profile.__table__).compile(dialect=dialect))
    assert "JSONB" in profile and "TEXT[]" in profile
    for model in (Opportunity, Shortlist):
        ddl = str(CreateTable(model.__table__).compile(dialect=dialect))
        assert "GENERATED ALWAYS AS IDENTITY" in ddl
    assert "UNIQUE (user_id, opportunity_id)" in str(
        CreateTable(Shortlist.__table__).compile(dialect=dialect)
    )


def test_saved_state_is_always_owner_scoped_and_parameterized() -> None:
    expression = saved_state("user_fictional")
    compiled = expression.compile(dialect=postgresql.dialect())
    assert "shortlist.user_id =" in str(compiled)
    assert "shortlist.opportunity_id = opportunities.id" in str(compiled)
    assert "user_fictional" not in str(compiled)
    assert "user_fictional" in compiled.params.values()


def test_search_wildcards_are_literal_and_all_filters_are_bound() -> None:
    filters = opportunity_filters(
        OpportunityQuery(q="50%_value", country="DE", type="job", work_mode="onsite")
    )
    assert len(filters) == 4
    compiled = filters[0].compile(dialect=postgresql.dialect())
    assert "50%_value" not in str(compiled)
    assert "50/%/_value" in compiled.params.values()
