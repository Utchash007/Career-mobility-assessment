import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { collectionHref } from "../lib/queries/navigation.ts";

test("page links preserve supported filters and replace the page once", () => {
  const link = collectionHref(
    "/opportunities",
    "page=1&page_size=10&country=DE&q=programme&sort=title_asc",
    2,
  );
  const url = new URL(link, "https://frontend.example.test");
  assert.equal(url.pathname, "/opportunities");
  assert.equal(url.searchParams.get("country"), "DE");
  assert.deepEqual(url.searchParams.getAll("page"), ["2"]);
  assert.throws(() => collectionHref("/recommendations", "sort=id_asc"));
});

test("pagination guards zero and out-of-range pages before using Flowbite", () => {
  const source = readFileSync(
    new URL(
      "../components/CollectionPagination/CollectionPagination.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(source, /pagination\.total_pages === 0/);
  assert.match(source, /pagination\.page > pagination\.total_pages/);
  assert.match(source, /collectionHref\(route, query, page\)/);
});

test("browsing uses one backend collection request and does not require a profile", () => {
  const source = readFileSync(
    new URL(
      "../components/OpportunitiesScreen/OpportunitiesScreen.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(source, /getOpportunities\(query\)/);
  assert.doesNotMatch(source, /getProfile|\.sort\(|\.filter\(/);
  assert.match(source, /result\.pagination\.total/);
});
