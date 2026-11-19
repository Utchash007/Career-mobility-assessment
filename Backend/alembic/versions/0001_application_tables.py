"""Create the career profile, opportunity and shortlist tables.

Revision ID: 0001
Revises: None
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("user_id", sa.Text(), primary_key=True),
        sa.Column("full_name", sa.Text(), nullable=False),
        sa.Column("birthday", sa.Date()),
        sa.Column(
            "education", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")
        ),
        sa.Column("experience_years", sa.SmallInteger()),
        sa.Column(
            "skills",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        sa.Column(
            "languages", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")
        ),
        sa.Column(
            "preferred_locations",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        sa.Column(
            "career_interests",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        sa.Column(
            "work_authorisation",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text('\'{"status":"unknown","countries":[]}\'::jsonb'),
        ),
        *timestamps(),
        sa.CheckConstraint("char_length(full_name) BETWEEN 1 AND 200", name="profile_name_length"),
        sa.CheckConstraint("birthday >= DATE '1900-01-01'", name="profile_birthday_minimum"),
        sa.CheckConstraint("experience_years BETWEEN 0 AND 60", name="profile_experience_range"),
        sa.CheckConstraint("cardinality(skills) <= 30", name="profile_skills_limit"),
        sa.CheckConstraint("jsonb_array_length(languages) <= 10", name="profile_languages_limit"),
        sa.CheckConstraint(
            "cardinality(preferred_locations) <= 10", name="profile_locations_limit"
        ),
        sa.CheckConstraint("cardinality(career_interests) <= 15", name="profile_interests_limit"),
    )
    op.create_table(
        "opportunities",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("slug", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("organisation", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("country", sa.Text()),
        sa.Column("city", sa.Text()),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("experience_level", sa.Text(), nullable=False),
        sa.Column("min_years", sa.SmallInteger(), nullable=False, server_default=sa.text("0")),
        sa.Column("max_years", sa.SmallInteger()),
        sa.Column(
            "required_skills",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        sa.Column(
            "preferred_skills",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        sa.Column(
            "education_requirements",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "languages", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")
        ),
        sa.Column(
            "eligibility_requirements",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("work_mode", sa.Text(), nullable=False, server_default=sa.text("'onsite'")),
        *timestamps(),
        sa.UniqueConstraint("slug", name="opportunity_slug_unique"),
        sa.CheckConstraint("country ~ '^[A-Z]{2}$'", name="opportunity_country_format"),
        sa.CheckConstraint("type IN ('job', 'internship')", name="opportunity_type"),
        sa.CheckConstraint(
            "experience_level IN ('internship', 'entry', 'mid', 'senior')",
            name="opportunity_experience_level",
        ),
        sa.CheckConstraint("min_years BETWEEN 0 AND 60", name="opportunity_min_years"),
        sa.CheckConstraint("max_years BETWEEN 0 AND 60", name="opportunity_max_years"),
        sa.CheckConstraint(
            "max_years IS NULL OR max_years >= min_years", name="opportunity_years_order"
        ),
        sa.CheckConstraint(
            "cardinality(required_skills) <= 30", name="opportunity_required_skills_limit"
        ),
        sa.CheckConstraint(
            "cardinality(preferred_skills) <= 30", name="opportunity_preferred_skills_limit"
        ),
        sa.CheckConstraint(
            "jsonb_array_length(languages) <= 5", name="opportunity_languages_limit"
        ),
        sa.CheckConstraint(
            "jsonb_array_length(eligibility_requirements) <= 10",
            name="opportunity_eligibility_limit",
        ),
        sa.CheckConstraint(
            "work_mode IN ('onsite', 'hybrid', 'remote')", name="opportunity_work_mode"
        ),
        sa.CheckConstraint(
            "country IS NOT NULL OR work_mode = 'remote'", name="opportunity_remote_country"
        ),
        sa.CheckConstraint(
            "work_mode != 'onsite' OR city IS NOT NULL AND char_length(city) > 0",
            name="opportunity_onsite_city",
        ),
    )
    op.create_table(
        "shortlist",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Text(),
            sa.ForeignKey("profiles.user_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "opportunity_id",
            sa.BigInteger(),
            sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("note", sa.Text(), nullable=False, server_default=sa.text("''")),
        *timestamps(),
        sa.UniqueConstraint("user_id", "opportunity_id", name="shortlist_owner_opportunity_unique"),
        sa.CheckConstraint("char_length(note) <= 500", name="shortlist_note_length"),
    )
    op.create_index("shortlist_opportunity_id_idx", "shortlist", ["opportunity_id"])


def downgrade() -> None:
    op.drop_table("shortlist")
    op.drop_table("opportunities")
    op.drop_table("profiles")
