import "./support/render-loader.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { ThemeProvider } from "flowbite-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { APP_THEME } from "../lib/display/flowbite-theme.ts";
import { MATCH_LABEL_TEXT } from "../lib/display/labels.ts";
import {
  matchFixture,
  opportunityFixture,
  profileFixture,
} from "./fixtures/contracts.mjs";
import { finalizedHeadlines } from "./fixtures/finalized-headlines.mjs";

// Dynamic imports begin after the test-only loader has registered its hooks.
const [
  MatchScore,
  MatchLabelBadge,
  EligibilityFlags,
  MatchBreakdown,
  OpportunityRequirements,
  OpportunityMeta,
  ProfileSummary,
] = await Promise.all(
  [
    "MatchScore",
    "MatchLabelBadge",
    "EligibilityFlags",
    "MatchBreakdown",
    "OpportunityRequirements",
    "OpportunityMeta",
    "ProfileSummary",
  ].map(
    async (name) => (await import(`../components/${name}/${name}.tsx`)).default,
  ),
);

// Static rendering checks real pinned React/Flowbite output, not hydration/events/focus.
const render = (component, props) =>
  renderToStaticMarkup(
    createElement(
      ThemeProvider,
      { theme: APP_THEME, applyTheme: "replace" },
      createElement(component, props),
    ),
  );

test("real Flowbite progress exposes zero, bounds, palette and a meaningful label", () => {
  const html = render(MatchScore, { score: 0, evaluated: 5 });
  assert.match(html, /0\.0 \/ 100/);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-valuenow="0"/);
  assert.match(html, /aria-valuemin="0"/);
  assert.match(html, /aria-valuemax="100"/);
  assert.match(html, /aria-label="Backend fit score, out of 100"/);
  assert.match(html, /bg-action/);
  const unknown = render(MatchScore, { score: null, evaluated: 0 });
  assert.match(unknown, /Insufficient data/);
  assert.doesNotMatch(unknown, /progressbar/);
});

test("all match labels render meaningful text rather than only status colors", () => {
  for (const label of [
    "strong",
    "partial",
    "weak",
    "not_recommended",
    "insufficient_data",
  ]) {
    const html = render(MatchLabelBadge, { label });
    assert.ok(html.replace(/<[^>]*>/g, "").trim().length > 0);
  }
});

test("finalized backend scenario headlines retain scores, labels and verification findings", () => {
  for (const item of finalizedHeadlines) {
    assert.match(
      render(MatchScore, {
        score: item.overall_score,
        evaluated: item.criteria_evaluated,
      }),
      new RegExp(`${item.overall_score.toFixed(1)} / 100`),
    );
    assert.ok(
      render(MatchLabelBadge, { label: item.label }).includes(
        MATCH_LABEL_TEXT[item.label],
      ),
    );
    const flags = render(EligibilityFlags, { flags: item.flags });
    assert.match(flags, /Requires verification/);
    if (item.label === "not_recommended")
      assert.match(flags, /Critical eligibility gap/);
  }
});

test("critical eligibility findings render visibly and hostile text is escaped", () => {
  const html = render(EligibilityFlags, {
    flags: [
      {
        code: "language",
        severity: "critical",
        message: "<script>alert('fictional')</script>",
      },
    ],
  });
  assert.match(html, /text-critical/);
  assert.match(html, /Critical/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|accordion|tooltip/);
});

test("full breakdown renders all five criteria without dumping arbitrary evidence", () => {
  const match = matchFixture();
  match.criteria[0].evidence = { unexpected: "DO_NOT_DUMP" };
  const html = render(MatchBreakdown, { match });
  for (const title of [
    "Skills",
    "Language",
    "Experience",
    "Education",
    "Location",
  ])
    assert.match(html, new RegExp(title));
  assert.match(html, /0 of 5 criteria evaluated/);
  assert.doesNotMatch(html, /DO_NOT_DUMP/);
});

test("requirements distinguish preferred language and sponsorship unknown/false", () => {
  const opportunity = opportunityFixture({
    languages: [{ language: "en", min_level: "professional", required: false }],
    eligibility_requirements: [
      {
        code: "work_authorisation",
        label: "Fictional rule",
        severity: "critical",
        params: { country: "DE", sponsorship: false },
      },
    ],
  });
  const html = render(OpportunityRequirements, { opportunity });
  assert.match(html, /preferred/);
  assert.match(html, /not available/);
  assert.match(html, /not findings about you/);
  opportunity.eligibility_requirements[0].params.sponsorship = null;
  assert.match(
    render(OpportunityRequirements, { opportunity }),
    /not specified/,
  );
});

test("global remote metadata and privacy-minimal profile output are explicit", () => {
  assert.match(
    render(OpportunityMeta, {
      opportunity: opportunityFixture({
        country: null,
        city: null,
        work_mode: "remote",
      }),
    }),
    /Global remote/,
  );
  const profile = profileFixture({
    birthday: "1998-04-12",
    experience_years: 0,
  });
  const html = render(ProfileSummary, { profile });
  assert.match(html, /0 years/);
  assert.doesNotMatch(html, /1998-04-12|user_fictional/);
});
