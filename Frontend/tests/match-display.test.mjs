import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  criterionEvidence,
  matchReasons,
  scoreText,
} from "../lib/display/matches.ts";
import { matchFixture } from "./fixtures/contracts.mjs";

test("zero and missing match scores are different", () => {
  assert.equal(scoreText(0), "0.0 / 100");
  assert.equal(scoreText(null), "Insufficient data");
  assert.equal(scoreText(95.2), "95.2 / 100");
});

test("known evidence preserves zero/null and unsupported objects are omitted", () => {
  assert.deepEqual(
    criterionEvidence({
      key: "experience",
      evidence: { actual_years: 0, min_years: 0, max_years: null },
    }),
    [
      { label: "Declared years", value: "0" },
      { label: "Opportunity range", value: "0+; no maximum specified" },
    ],
  );
  assert.deepEqual(
    criterionEvidence({
      key: "language",
      evidence: {
        requirements: [
          {
            language: "en",
            actual_level: null,
            required_level: "professional",
            required: true,
          },
        ],
      },
    })[0],
    {
      label: "English · required",
      value: "Declared: not declared; minimum: Professional",
    },
  );
  assert.deepEqual(
    criterionEvidence({
      key: "skills",
      evidence: { secret: { arbitrary: "never render" } },
    }),
    [],
  );
});

test("summaries preserve backend statuses and reasons without inventing scoring", () => {
  const match = matchFixture();
  match.criteria[0] = {
    ...match.criteria[0],
    status: "met",
    reason: "Backend strength",
  };
  match.criteria[1] = {
    ...match.criteria[1],
    status: "unmet",
    reason: "Backend gap",
  };
  const result = matchReasons(match);
  assert.equal(result.strengths[0].reason, "Backend strength");
  assert.equal(result.gaps[0].reason, "Backend gap");
  assert.equal(result.unknown.length, 3);
});

test("eligibility findings appear before the fit score and never inside an accordion", () => {
  const source = readFileSync(
    new URL(
      "../components/RecommendationCard/RecommendationCard.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.ok(
    source.indexOf("<EligibilityFlags") < source.indexOf("<MatchScore"),
  );
  assert.doesNotMatch(source, /Accordion|Tooltip|fetch\(|getMatch\(/);
});

test("recommendations preserve returned ordering and use no match sort or N+1 fetch", () => {
  const source = readFileSync(
    new URL(
      "../components/RecommendationsScreen/RecommendationsScreen.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(source, /getMatches\(query\)/);
  assert.doesNotMatch(source, /\.sort\(|getMatch\(|getOpportunity\(/);
});
