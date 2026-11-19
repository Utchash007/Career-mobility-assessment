import assert from "node:assert/strict";
import test from "node:test";
import {
  apiErrorBodySchema,
  healthResponseSchema,
} from "../lib/contracts/common.ts";
import {
  matchPath,
  opportunityPath,
  parseOpportunityId,
  shortlistPath,
} from "../lib/contracts/endpoints.ts";
import {
  matchListItemSchema,
  matchResultSchema,
} from "../lib/contracts/match.ts";
import { dataDeletionResponseSchema } from "../lib/contracts/me.ts";
import {
  opportunityPageSchema,
  opportunitySummarySchema,
} from "../lib/contracts/opportunity.ts";
import {
  shortlistNoteUpdateSchema,
  shortlistSaveSchema,
} from "../lib/contracts/shortlist.ts";
import {
  emptyPageFixture,
  matchFixture,
  opportunityFixture,
} from "./fixtures/contracts.mjs";

test("nullable education requirements and global remote locations are valid", () => {
  const role = opportunitySummarySchema.parse(
    opportunityFixture({
      country: null,
      city: null,
      work_mode: "remote",
      education_requirements: {},
    }),
  );
  assert.equal(role.country, null);
  assert.equal(role.max_years, null);
  assert.deepEqual(role.education_requirements, {
    required: null,
    preferred: null,
  });
  assert.equal(
    opportunitySummarySchema.safeParse(opportunityFixture({ country: null }))
      .success,
    false,
  );
  assert.equal(
    opportunitySummarySchema.safeParse(
      opportunityFixture({ max_years: 1, min_years: 2 }),
    ).success,
    false,
  );
});

test("requirement variants forbid wrong params and retain unknown sponsorship", () => {
  const role = opportunitySummarySchema.parse(
    opportunityFixture({
      eligibility_requirements: [
        {
          code: "work_authorisation",
          label: "Check status",
          severity: "verify",
          params: {},
        },
      ],
    }),
  );
  assert.deepEqual(role.eligibility_requirements[0].params, {
    country: null,
    sponsorship: null,
  });
  assert.equal(
    opportunitySummarySchema.safeParse(
      opportunityFixture({
        eligibility_requirements: [
          {
            code: "enrolment",
            label: "Enrolment",
            severity: "critical",
            params: { country: "DE" },
          },
        ],
      }),
    ).success,
    false,
  );
});

test("match scores keep null and zero and evidence remains criterion-specific", () => {
  const unknown = matchResultSchema.parse(matchFixture());
  assert.equal(unknown.overall_score, null);
  assert.equal(unknown.criteria[0].score, null);
  const fixture = matchFixture({
    overall_score: 0,
    label: "weak",
    criteria_evaluated: 1,
  });
  fixture.criteria[0] = {
    ...fixture.criteria[0],
    score: 0,
    status: "unmet",
    evidence: {
      matched: [],
      missing: ["excel"],
      future_nested_shape: { value: null },
    },
  };
  const zero = matchResultSchema.parse(fixture);
  assert.equal(zero.overall_score, 0);
  assert.equal(zero.criteria[0].score, 0);
  assert.deepEqual(zero.criteria[0].evidence, fixture.criteria[0].evidence);
  fixture.criteria[0].score = 95;
  assert.equal(matchResultSchema.safeParse(fixture).success, false);
});

test("matches cannot duplicate criteria or refer to another opportunity", () => {
  const match = matchFixture();
  match.criteria[1].key = "skills";
  assert.equal(matchResultSchema.safeParse(match).success, false);
  assert.equal(
    matchListItemSchema.safeParse({
      opportunity: opportunityFixture(),
      match: matchFixture({ opportunity_id: 2 }),
    }).success,
    false,
  );
});

test("pagination accepts empty and out-of-range pages with their actual totals", () => {
  assert.deepEqual(opportunityPageSchema.parse(emptyPageFixture()).items, []);
  const outside = emptyPageFixture({ page: 4, total: 12, total_pages: 2 });
  assert.equal(opportunityPageSchema.parse(outside).pagination.total, 12);
  outside.pagination.has_previous = true;
  assert.equal(opportunityPageSchema.safeParse(outside).success, false);
});

test("save omission preserves a note; explicit empty string clears it", () => {
  assert.deepEqual(shortlistSaveSchema.parse({}), {});
  assert.deepEqual(shortlistSaveSchema.parse({ note: "" }), { note: "" });
  assert.equal(shortlistSaveSchema.safeParse({ note: null }).success, false);
  assert.equal(shortlistNoteUpdateSchema.safeParse({}).success, false);
  assert.equal(
    shortlistNoteUpdateSchema.parse({ note: " keep whitespace " }).note,
    " keep whitespace ",
  );
  assert.equal(
    shortlistSaveSchema.safeParse({ note: "😀".repeat(500) }).success,
    true,
  );
  assert.equal(
    shortlistSaveSchema.safeParse({ note: "😀".repeat(501) }).success,
    false,
  );
});

test("application deletion can never claim Clerk identity deletion", () => {
  const deletion = {
    scope: "application_data",
    profile_deleted: true,
    shortlist_deleted: 2,
    clerk_account_deleted: false,
  };
  assert.deepEqual(dataDeletionResponseSchema.parse(deletion), deletion);
  assert.equal(
    dataDeletionResponseSchema.safeParse({
      ...deletion,
      clerk_account_deleted: true,
    }).success,
    false,
  );
});

test("health stays liveness-only and error fields retain safe dotted paths", () => {
  assert.deepEqual(healthResponseSchema.parse({ status: "ok" }), {
    status: "ok",
  });
  const error = {
    code: "VALIDATION_ERROR",
    message: "Request is invalid.",
    fields: { "languages.0.level": "Value is invalid." },
  };
  assert.deepEqual(apiErrorBodySchema.parse(error), error);
  assert.equal(
    apiErrorBodySchema.safeParse({ detail: "Not the application contract" })
      .success,
    false,
  );
});

test("route IDs and endpoint constructors cannot select an arbitrary path or user", () => {
  assert.equal(parseOpportunityId("001"), 1);
  assert.equal(opportunityPath(1), "/api/v1/opportunities/1");
  assert.equal(matchPath(1), "/api/v1/matches/1");
  assert.equal(shortlistPath(1), "/api/v1/shortlist/1");
  for (const id of [
    "0",
    "-1",
    "1.5",
    "1e2",
    "1\n",
    "../me",
    "https://example.invalid",
    "9007199254740992",
  ]) {
    assert.throws(() => parseOpportunityId(id), id);
  }
  assert.throws(() => opportunityPath(Number.NaN));
});
