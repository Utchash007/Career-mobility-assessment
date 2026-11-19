import assert from "node:assert/strict";
import test from "node:test";
import { loadOpportunityDetail } from "../lib/api/detail.ts";
import { ApiFailure } from "../lib/api/errors.ts";
import {
  detailReturnHref,
  opportunityDetailHref,
} from "../lib/queries/details.ts";
import {
  matchFixture,
  opportunityFixture,
  profileFixture,
} from "./fixtures/contracts.mjs";

test("detail return links accept only known collection context", () => {
  const href = opportunityDetailHref(1, {
    route: "/recommendations",
    query: "page=2&page_size=10&country=DE",
  });
  const url = new URL(href, "https://frontend.example.test");
  assert.equal(
    detailReturnHref(Object.fromEntries(url.searchParams)),
    "/recommendations?page=2&page_size=10&country=DE",
  );
  for (const params of [
    { from: "https://evil.test", query: "" },
    { from: ["opportunities"], query: "" },
    { from: "opportunities", query: "return=https://evil.test" },
    { return: "//evil.test" },
  ])
    assert.equal(detailReturnHref(params), "/opportunities");
});

test("opportunity and profile reads start independently; match waits only for profile", async () => {
  let resolveOpportunity;
  const events = [];
  const result = loadOpportunityDetail(
    {
      getOpportunity: () => {
        events.push("opportunity");
        return new Promise((resolve) => {
          resolveOpportunity = resolve;
        });
      },
      getProfile: async () => {
        events.push("profile");
        return profileFixture();
      },
      getMatch: async () => {
        events.push("match");
        resolveOpportunity(opportunityFixture());
        return matchFixture();
      },
    },
    1,
  );
  assert.deepEqual(events, ["opportunity", "profile"]);
  assert.equal((await result).match.status, "available");
  assert.deepEqual(events, ["opportunity", "profile", "match"]);
});

test("missing/deleted profiles never hide role data or trigger unnecessary matching", async () => {
  let matches = 0;
  const result = await loadOpportunityDetail(
    {
      getOpportunity: async () => opportunityFixture(),
      getProfile: async () => {
        throw new ApiFailure("not_found", 404, "PROFILE_NOT_FOUND");
      },
      getMatch: async () => {
        matches++;
      },
    },
    1,
  );
  assert.equal(result.opportunity.status, "fulfilled");
  assert.equal(result.match.status, "profile_required");
  assert.equal(matches, 0);
  const race = await loadOpportunityDetail(
    {
      getOpportunity: async () => opportunityFixture(),
      getProfile: async () => profileFixture(),
      getMatch: async () => {
        throw new ApiFailure("invalid_request", 409, "PROFILE_REQUIRED");
      },
    },
    1,
  );
  assert.equal(race.match.status, "profile_required");
});

test("match failure is isolated from an available opportunity", async () => {
  const result = await loadOpportunityDetail(
    {
      getOpportunity: async () => opportunityFixture(),
      getProfile: async () => profileFixture(),
      getMatch: async () => {
        throw new ApiFailure("unavailable", 503);
      },
    },
    1,
  );
  assert.equal(result.opportunity.status, "fulfilled");
  assert.deepEqual(result.match, { status: "error", reason: "unavailable" });
});
