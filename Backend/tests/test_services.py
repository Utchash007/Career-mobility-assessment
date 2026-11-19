"""Offline orchestration tests with fictional objects, not database user fixtures."""

from contextlib import asynccontextmanager
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest

from app.core.errors import APIError
from app.db.models import Opportunity, Profile, Shortlist
from app.db.seed import load_seed
from app.schemas.query import MatchQuery
from app.schemas.shortlist import ShortlistSave
from app.services import match, me, profile, shortlist


class OfflineSession:
    @asynccontextmanager
    async def begin(self):
        yield


def fictional_profile() -> Profile:
    now = datetime.now(UTC)
    values = dict(profile.SAMPLE_PROFILE)
    values["birthday"] = None
    return Profile(**values, user_id="user_fictional_offline", created_at=now, updated_at=now)


def fictional_roles() -> list[tuple[Opportunity, bool]]:
    now = datetime.now(UTC)
    return [
        (Opportunity(**role.model_dump(mode="json"), id=i, created_at=now, updated_at=now), False)
        for i, role in enumerate(load_seed(), 1)
    ]


@pytest.mark.asyncio
async def test_recommendations_rank_complete_set_before_pagination() -> None:
    with (
        patch("app.services.match.find_profile", AsyncMock(return_value=fictional_profile())),
        patch(
            "app.services.match.repository.list_opportunities",
            AsyncMock(return_value=fictional_roles()),
        ) as read,
    ):
        page = await match.list_matches(
            OfflineSession(), "user_fictional_offline", MatchQuery(page_size=1)
        )
    assert page.items[0].opportunity.id == 4  # Best score is not the first database row.
    assert page.pagination.total == 12
    read.assert_awaited_once()
    assert read.call_args.args[1] == "user_fictional_offline"


@pytest.mark.asyncio
async def test_label_filter_changes_totals_before_paging() -> None:
    with (
        patch("app.services.match.find_profile", AsyncMock(return_value=fictional_profile())),
        patch(
            "app.services.match.repository.list_opportunities",
            AsyncMock(return_value=fictional_roles()),
        ),
    ):
        page = await match.list_matches(
            OfflineSession(),
            "user_fictional_offline",
            MatchQuery(label="not_recommended", page_size=1),
        )
    assert page.pagination.total == 2
    assert len(page.items) == 1 and page.items[0].match.label == "not_recommended"


@pytest.mark.asyncio
async def test_missing_profile_precedes_opportunity_lookup() -> None:
    with (
        patch("app.services.match.find_profile", AsyncMock(return_value=None)),
        patch("app.services.match.repository.find_opportunity", AsyncMock()) as read,
    ):
        with pytest.raises(APIError) as error:
            await match.get_match(OfflineSession(), "user_fictional_offline", 999)
    assert error.value.code == "PROFILE_REQUIRED"
    read.assert_not_awaited()


@pytest.mark.asyncio
async def test_shortlist_requires_profile_before_save() -> None:
    with (
        patch("app.services.shortlist.find_profile", AsyncMock(return_value=None)),
        patch("app.services.shortlist.find_opportunity", AsyncMock()) as read,
    ):
        with pytest.raises(APIError) as error:
            await shortlist.save(OfflineSession(), "user_fictional_offline", 1, ShortlistSave())
    assert error.value.code == "PROFILE_REQUIRED"
    read.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload,changed", [(ShortlistSave(), False), (ShortlistSave(note=""), True)]
)
async def test_repeated_save_preserves_or_explicitly_updates_note(
    payload: ShortlistSave, changed: bool
) -> None:
    now = datetime.now(UTC)
    saved = Shortlist(
        user_id="user_fictional_offline",
        opportunity_id=1,
        note="Keep this note",
        created_at=now,
        updated_at=now,
    )
    with (
        patch("app.services.shortlist.find_profile", AsyncMock(return_value=fictional_profile())),
        patch(
            "app.services.shortlist.find_opportunity", AsyncMock(return_value=fictional_roles()[0])
        ),
        patch("app.services.shortlist.repository.add_saved", AsyncMock(return_value=None)),
        patch("app.services.shortlist.repository.find_saved", AsyncMock(return_value=saved)),
        patch("app.services.shortlist.repository.change_note", AsyncMock()) as change,
    ):
        result, created = await shortlist.save(
            OfflineSession(), "user_fictional_offline", 1, payload
        )
    assert not created
    assert result.created_at == now
    assert result.opportunity.is_shortlisted
    assert bool(change.await_count) is changed


@pytest.mark.asyncio
async def test_deletion_counts_and_retries_do_not_call_clerk() -> None:
    with (
        patch("app.services.me.find_profile", AsyncMock(return_value=fictional_profile())) as lock,
        patch("app.services.me.delete_owned_data", AsyncMock(return_value=(True, 2))) as delete,
    ):
        result = await me.delete_data(OfflineSession(), "user_fictional_offline")
    assert lock.call_args.kwargs == {"lock": True}
    assert delete.call_args.args[1] == "user_fictional_offline"
    assert result.profile_deleted and result.shortlist_deleted == 2
    assert result.clerk_account_deleted is False
    with (
        patch("app.services.me.find_profile", AsyncMock(return_value=None)),
        patch("app.services.me.delete_owned_data", AsyncMock()) as delete,
    ):
        retry = await me.delete_data(OfflineSession(), "user_fictional_offline")
    assert not retry.profile_deleted and retry.shortlist_deleted == 0
    delete.assert_not_awaited()
