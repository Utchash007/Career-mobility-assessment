import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const component = (name) => readFileSync(new URL(`../components/${name}/${name}.tsx`, import.meta.url), "utf8");

test("dashboard counts use backend pagination and exclude birthday from summary", () => {
  const source = component("DashboardScreen");
  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /catalog\.value\.pagination\.total/);
  assert.match(source, /shortlist\.value\.pagination\.total/);
  assert.doesNotMatch(component("ProfileSummary"), /birthday|user_id/);
});

test("application-data deletion is deliberate and never invokes Clerk deletion", () => {
  const source = component("DeleteApplicationDataAction");
  assert.match(source, /ConfirmationDialog/);
  assert.match(source, /api\.deleteApplicationData\(\)/);
  assert.match(source, /window\.location\.replace\("\/profile"\)/);
  assert.match(source, /useOperation\("application-data"\)/);
  assert.doesNotMatch(source, /user\.delete|clerk\.delete|signOut\(|useEffect/);
  assert.match(source, /Deletion has not been confirmed/);
});
