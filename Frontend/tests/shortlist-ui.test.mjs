import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readSavedItem } from "../lib/api/saved-item.ts";
import { createWriteCoordinator } from "../lib/session/writes.ts";

const component = (name) =>
  readFileSync(
    new URL(`../components/${name}/${name}.tsx`, import.meta.url),
    "utf8",
  );

test("same-item note/toggle operations serialize and deletion excludes other writes", () => {
  const writes = createWriteCoordinator();
  assert.equal(writes.acquire("shortlist-1"), true);
  assert.equal(writes.acquire("shortlist-1"), false);
  assert.equal(writes.acquire("application-data"), false);
  writes.release("shortlist-1");
  assert.equal(writes.acquire("application-data"), true);
  assert.equal(writes.acquire("profile"), false);
});

test("repeated saves omit notes and distinguish confirmed writes from refetch failures", () => {
  const source = component("ShortlistAction");
  assert.match(source, /saveShortlist\(opportunityId, \{\}\)/);
  assert.match(source, /refreshing current state failed/);
  assert.match(source, /error\.unconfirmed \? null : previous/);
  assert.match(source, /ConfirmationDialog/);
});

test("notes have explicit save, Unicode character counting and no autosave/storage", () => {
  const source = component("ShortlistNoteEditor");
  assert.match(source, /api\.updateNote\(item\.opportunity_id, parsed\.data\)/);
  assert.match(source, /characterCount\(draft\)/);
  assert.doesNotMatch(
    source,
    /useEffect|localStorage|sessionStorage|maxLength/,
  );
});

test("bounded note reconciliation only returns the current user's exact item", async () => {
  const item = { opportunity_id: 2, note: "private fictional note" };
  const api = {
    getShortlist: async ({ page }) => ({
      items: page === 1 ? [{ opportunity_id: 1 }] : [item],
      pagination: { has_next: page === 1 },
    }),
  };
  assert.equal(await readSavedItem(api, 2, "Fictional title"), item);
  await assert.rejects(
    readSavedItem(
      {
        getShortlist: async () => ({
          items: [],
          pagination: { has_next: false },
        }),
      },
      2,
      "Title",
    ),
    (error) => error.status === 404,
  );
});
