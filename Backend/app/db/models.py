"""Postgres application tables; identity belongs to Clerk, not a users table."""

from datetime import date, datetime
from typing import Any

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, ForeignKey, Identity, Index, SmallInteger, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Timestamps:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Profile(Timestamps, Base):
    __tablename__ = "profiles"
    __table_args__ = (
        CheckConstraint("char_length(full_name) BETWEEN 1 AND 200", name="profile_name_length"),
        CheckConstraint("birthday >= DATE '1900-01-01'", name="profile_birthday_minimum"),
        CheckConstraint("experience_years BETWEEN 0 AND 60", name="profile_experience_range"),
        CheckConstraint("cardinality(skills) <= 30", name="profile_skills_limit"),
        CheckConstraint("jsonb_array_length(languages) <= 10", name="profile_languages_limit"),
        CheckConstraint("cardinality(preferred_locations) <= 10", name="profile_locations_limit"),
        CheckConstraint("cardinality(career_interests) <= 15", name="profile_interests_limit"),
    )
    user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    full_name: Mapped[str] = mapped_column(Text)
    birthday: Mapped[date | None] = mapped_column(Date)
    education: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    experience_years: Mapped[int | None] = mapped_column(SmallInteger)
    skills: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'::text[]"))
    languages: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    preferred_locations: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'::text[]"))
    career_interests: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'::text[]"))
    work_authorisation: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{\"status\":\"unknown\",\"countries\":[]}'::jsonb"))


class Opportunity(Timestamps, Base):
    __tablename__ = "opportunities"
    __table_args__ = (
        UniqueConstraint("slug", name="opportunity_slug_unique"),
        CheckConstraint("country ~ '^[A-Z]{2}$'", name="opportunity_country_format"),
        CheckConstraint("type IN ('job', 'internship')", name="opportunity_type"),
        CheckConstraint("experience_level IN ('internship', 'entry', 'mid', 'senior')", name="opportunity_experience_level"),
        CheckConstraint("min_years BETWEEN 0 AND 60", name="opportunity_min_years"),
        CheckConstraint("max_years BETWEEN 0 AND 60", name="opportunity_max_years"),
        CheckConstraint("max_years IS NULL OR max_years >= min_years", name="opportunity_years_order"),
        CheckConstraint("cardinality(required_skills) <= 30", name="opportunity_required_skills_limit"),
        CheckConstraint("cardinality(preferred_skills) <= 30", name="opportunity_preferred_skills_limit"),
        CheckConstraint("jsonb_array_length(languages) <= 5", name="opportunity_languages_limit"),
        CheckConstraint("jsonb_array_length(eligibility_requirements) <= 10", name="opportunity_eligibility_limit"),
        CheckConstraint("work_mode IN ('onsite', 'hybrid', 'remote')", name="opportunity_work_mode"),
        CheckConstraint("country IS NOT NULL OR work_mode = 'remote'", name="opportunity_remote_country"),
        CheckConstraint("work_mode != 'onsite' OR city IS NOT NULL AND char_length(city) > 0", name="opportunity_onsite_city"),
    )
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    slug: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text)
    organisation: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    country: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str] = mapped_column(Text)
    experience_level: Mapped[str] = mapped_column(Text)
    min_years: Mapped[int] = mapped_column(SmallInteger, server_default=text("0"))
    max_years: Mapped[int | None] = mapped_column(SmallInteger)
    required_skills: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'::text[]"))
    preferred_skills: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'::text[]"))
    education_requirements: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    languages: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    eligibility_requirements: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    work_mode: Mapped[str] = mapped_column(Text, server_default=text("'onsite'"))


class Shortlist(Timestamps, Base):
    __tablename__ = "shortlist"
    __table_args__ = (
        UniqueConstraint("user_id", "opportunity_id", name="shortlist_owner_opportunity_unique"),
        CheckConstraint("char_length(note) <= 500", name="shortlist_note_length"),
        Index("shortlist_opportunity_id_idx", "opportunity_id"),
    )
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    user_id: Mapped[str] = mapped_column(Text, ForeignKey("profiles.user_id", ondelete="CASCADE"))
    opportunity_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("opportunities.id", ondelete="CASCADE"))
    note: Mapped[str] = mapped_column(Text, server_default=text("''"))
