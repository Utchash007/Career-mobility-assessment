import type { ShortlistItem } from "../contracts/shortlist.ts";

type SavedNote = Pick<ShortlistItem, "note" | "updated_at">;
export interface NoteDraft {
  saved: SavedNote;
  draft: string;
  observedVersion: string;
}

export function createNoteDraft(item: SavedNote): NoteDraft {
  return {
    saved: { note: item.note, updated_at: item.updated_at },
    draft: item.note,
    observedVersion: item.updated_at,
  };
}

export function acceptNoteSave(state: NoteDraft, item: SavedNote): NoteDraft {
  return {
    ...state,
    saved: { note: item.note, updated_at: item.updated_at },
    draft: item.note,
  };
}

export function refreshNoteDraft(state: NoteDraft, item: SavedNote): NoteDraft {
  if (state.observedVersion === item.updated_at) return state;
  const observed = { ...state, observedVersion: item.updated_at };
  // Do not erase dirty edits or roll a confirmed response back to an older RSC read.
  if (
    state.draft !== state.saved.note ||
    Date.parse(item.updated_at) < Date.parse(state.saved.updated_at)
  )
    return observed;
  return acceptNoteSave(observed, item);
}
