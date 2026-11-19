import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptNoteSave,
  createNoteDraft,
  refreshNoteDraft,
} from "../lib/forms/note-draft.ts";

const first = { note: "original", updated_at: "2026-11-19T10:00:00Z" };
const next = { note: "saved edit", updated_at: "2026-11-19T10:01:00Z" };

test("confirmed note saves survive stale server props, then converge on refresh", () => {
  const initial = createNoteDraft(first);
  const saved = acceptNoteSave({ ...initial, draft: next.note }, next);
  assert.equal(refreshNoteDraft(saved, first), saved);
  assert.equal(refreshNoteDraft(saved, next).draft, next.note);
  const older = { note: "stale", updated_at: "2026-11-19T10:00:30Z" };
  assert.equal(refreshNoteDraft(saved, older).draft, next.note);
});

test("background refresh retains dirty notes and clean drafts adopt new saved state", () => {
  const state = createNoteDraft(first);
  assert.equal(
    refreshNoteDraft({ ...state, draft: "unsaved" }, next).draft,
    "unsaved",
  );
  assert.equal(refreshNoteDraft(state, next).draft, next.note);
  assert.equal(acceptNoteSave(state, { ...next, note: "" }).draft, "");
});
