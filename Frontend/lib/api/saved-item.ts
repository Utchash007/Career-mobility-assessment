import type { ApiClient } from "./client.ts";
import { ApiFailure } from "./errors.ts";

// There is no single-item shortlist GET. Explicit reconciliation uses bounded
// current-user list reads, never an inferred save or another user's item.
export async function readSavedItem(api: ApiClient, id: number, title: string) {
  const q = Array.from(title).slice(0, 100).join("").trim();
  for (let page = 1; page <= 20; page++) {
    const result = await api.getShortlist({ page, page_size: 100, sort: "title_asc", ...(q ? { q } : {}) });
    const item = result.items.find((candidate) => candidate.opportunity_id === id);
    if (item) return item;
    if (!result.pagination.has_next) throw new ApiFailure("not_found", 404, "SHORTLIST_ITEM_NOT_FOUND");
  }
  throw new ApiFailure("unavailable", 503);
}
