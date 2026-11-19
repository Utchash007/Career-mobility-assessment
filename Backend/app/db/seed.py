"""Explicit, validated seed command; never runs during startup or truncates data."""

import argparse
import asyncio
import json
from pathlib import Path

from pydantic import TypeAdapter, ValidationError
from sqlalchemy import func, or_
from sqlalchemy.dialects.postgresql import insert

from app.core.config import get_settings
from app.db.models import Opportunity
from app.db.session import Database
from app.schemas.opportunity import OpportunitySeed

SEED_FILE = Path(__file__).resolve().parents[1] / "data" / "seed_opportunities.json"


def load_seed(path: Path = SEED_FILE) -> list[OpportunitySeed]:
    rows = TypeAdapter(list[OpportunitySeed]).validate_json(path.read_text(encoding="utf-8"))
    if len(rows) != 12 or len({row.slug for row in rows}) != len(rows):
        raise ValueError("Seed must contain exactly twelve uniquely named opportunities.")
    for row in rows:
        expected = "internship" if row.type == "internship" else "senior" if row.min_years >= 8 else "mid" if row.min_years >= 2 else "entry"
        if row.experience_level != expected:
            raise ValueError("Seed experience display levels must agree with numeric requirements.")
        auth = [item for item in row.eligibility_requirements if item.code == "work_authorisation"]
        if row.country is None and auth or row.country is not None and (len(auth) != 1 or auth[0].params.country != row.country):
            raise ValueError("Seed work authorization must agree with the hiring country.")
    return rows


async def seed(rows: list[OpportunitySeed]) -> None:
    database = Database(get_settings())
    try:
        async for session in database.sessions():
            async with session.begin():
                for row in rows:
                    values = row.model_dump(mode="json", exclude_unset=True)
                    statement = insert(Opportunity).values(**values)
                    changes = {name: getattr(statement.excluded, name) for name in values if name != "slug"}
                    statement = statement.on_conflict_do_update(
                        index_elements=[Opportunity.slug],
                        set_={**changes, "updated_at": func.now()},
                        where=or_(*(getattr(Opportunity, name).is_distinct_from(value) for name, value in changes.items())),
                    )
                    await session.execute(statement)
    finally:
        await database.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description="Upsert twelve fictional roles without deleting existing data.")
    parser.add_argument("--apply", action="store_true", help="Authorize writes to the configured application database.")
    args = parser.parse_args()
    if not args.apply:
        parser.error("Supply --apply only after confirming the intended database.")
    try:
        rows = load_seed()
        asyncio.run(seed(rows))
    except (OSError, ValueError, ValidationError, json.JSONDecodeError):
        raise SystemExit("Seed failed; check fixture structure and database configuration. No credentials are shown.") from None
    except Exception:
        raise SystemExit("Seed failed; database changes were rolled back. Check connectivity and migrations.") from None
    print("Upserted twelve fictional opportunities by slug; existing IDs and unrelated rows were preserved.")


if __name__ == "__main__":
    main()
