import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import {
  APP_ROUTES,
  isActiveRoute,
  NAVIGATION_ITEMS,
} from "../lib/display/navigation.ts";

test("navigation destinations are unique fixed internal application routes", () => {
  const routes = Object.values(APP_ROUTES);
  assert.equal(new Set(routes).size, routes.length);
  assert.equal(
    new Set(NAVIGATION_ITEMS.map((item) => item.href)).size,
    routes.length,
  );
  for (const item of NAVIGATION_ITEMS) {
    assert.ok(routes.includes(item.href));
    assert.match(item.href, /^\/(?:[a-z]+)?$/);
    assert.ok(item.label.trim().length > 0);
  }
});

test("home does not become active on every nested route", () => {
  assert.equal(isActiveRoute("/", APP_ROUTES.home), true);
  for (const path of ["/profile", "/opportunities/12", "/missing", null]) {
    assert.equal(isActiveRoute(path, APP_ROUTES.home), false);
  }
});

test("collections stay active for details but not similar route prefixes", () => {
  assert.equal(isActiveRoute("/opportunities", APP_ROUTES.opportunities), true);
  assert.equal(
    isActiveRoute("/opportunities/12", APP_ROUTES.opportunities),
    true,
  );
  assert.equal(
    isActiveRoute("/opportunities/", APP_ROUTES.opportunities),
    true,
  );
  for (const path of [
    "/opportunities-other",
    "/opportunities2/12",
    "/recommendations/12",
    "//opportunities",
    null,
  ]) {
    assert.equal(isActiveRoute(path, APP_ROUTES.opportunities), false);
  }
});

test("every enabled navigation destination has an implemented page", () => {
  for (const item of NAVIGATION_ITEMS) {
    if (item.availability !== "available") continue;
    const page =
      item.href === "/" ? "page.tsx" : `${item.href.slice(1)}/page.tsx`;
    const groupedPage = `(app)/${page}`;
    assert.ok(
      existsSync(new URL(`../app/${page}`, import.meta.url)) ||
        existsSync(new URL(`../app/${groupedPage}`, import.meta.url)),
      item.href,
    );
  }
});
