import assert from "node:assert/strict";
import test from "node:test";
import {
  applyMatchFilters,
  applyOpportunityFilters,
  applyShortlistFilters,
  parseMatchQuery,
  parseOpportunityQuery,
  parseShortlistQuery,
  serializeMatchQuery,
  serializeOpportunityQuery,
  serializeShortlistQuery,
} from "../lib/queries/collections.ts";

test("collections share page defaults but retain endpoint-specific sorts", () => {
  assert.deepEqual(parseOpportunityQuery({}), {
    page: 1,
    page_size: 10,
    sort: "id_asc",
  });
  assert.deepEqual(parseMatchQuery(new URLSearchParams()), {
    page: 1,
    page_size: 10,
  });
  assert.deepEqual(parseShortlistQuery({}), {
    page: 1,
    page_size: 10,
    sort: "created_at_desc",
  });
});

test("invalid pagination fails instead of falling back or truncating", () => {
  for (const query of [
    "page=0",
    "page=1.5",
    "page=-1",
    "page=1e2",
    "page=",
    "page=%201",
    "page=1%0A",
    "page_size=101",
    "page_size=0",
    "page=9007199254740992",
  ]) {
    assert.throws(
      () => parseOpportunityQuery(new URLSearchParams(query)),
      query,
    );
  }
  assert.equal(
    parseOpportunityQuery({ page: "001", page_size: "100" }).page,
    1,
  );
});

test("duplicates and unsupported parameters are never silently forwarded", () => {
  for (const query of [
    "page=1&page=2",
    "q=a&q=b",
    "unknown=1",
    "user_id=user_fixture",
  ]) {
    assert.throws(
      () => parseOpportunityQuery(new URLSearchParams(query)),
      query,
    );
  }
  assert.throws(() => parseMatchQuery({ page: ["1", "2"] }));
  assert.throws(() => parseMatchQuery({ sort: "id_asc" }));
  assert.throws(() => parseOpportunityQuery({ label: "strong" }));
  assert.throws(() => parseShortlistQuery({ sort: "title_desc" }));
});

test("URL filters are exact and supplied blanks are invalid", () => {
  for (const query of [
    "q=",
    "q=%20",
    "country=de",
    "country=Germany",
    "country=ZZ",
    "type=Job",
    "work_mode=REMOTE",
    "work_mode=",
  ]) {
    assert.throws(
      () => parseOpportunityQuery(new URLSearchParams(query)),
      query,
    );
  }
  assert.throws(() => parseMatchQuery({ label: "unsupported" }));
  assert.equal(parseOpportunityQuery({ country: "NZ" }).country, "NZ");
});

test("round trips retain query text literally and use single-valued parameters", () => {
  const query = parseOpportunityQuery({
    page: "3",
    q: " R&D + 100% ",
    country: "DE",
    sort: "title_desc",
  });
  const encoded = serializeOpportunityQuery(query);
  assert.equal(encoded.get("q"), "R&D + 100%");
  assert.equal(encoded.getAll("q").length, 1);
  assert.deepEqual(parseOpportunityQuery(encoded), query);

  const matches = parseMatchQuery({ label: "not_recommended" });
  assert.equal(serializeMatchQuery(matches).has("sort"), false);
  assert.deepEqual(parseMatchQuery(serializeMatchQuery(matches)), matches);
  const shortlist = parseShortlistQuery({ sort: "title_asc" });
  assert.deepEqual(
    parseShortlistQuery(serializeShortlistQuery(shortlist)),
    shortlist,
  );
});

test("applying filters or page size always resets page and omits blank choices", () => {
  const draft = {
    q: "  ",
    country: "",
    type: "",
    work_mode: "",
    page_size: "25",
  };
  const opportunities = applyOpportunityFilters({ ...draft, sort: "id_asc" });
  assert.equal(opportunities.get("page"), "1");
  assert.equal(opportunities.get("page_size"), "25");
  for (const name of ["q", "country", "type", "work_mode"]) {
    assert.equal(opportunities.has(name), false);
  }
  assert.equal(applyMatchFilters({ ...draft, label: "" }).has("label"), false);
  assert.equal(
    applyShortlistFilters({ ...draft, sort: "created_at_asc" }).get("page"),
    "1",
  );
  assert.throws(() =>
    applyOpportunityFilters({ ...draft, page_size: "", sort: "id_asc" }),
  );
});

test("search length counts Unicode characters consistently with backend validation", () => {
  assert.equal(parseMatchQuery({ q: "😀".repeat(100) }).q.length, 200);
  assert.throws(() => parseMatchQuery({ q: "😀".repeat(101) }));
});
