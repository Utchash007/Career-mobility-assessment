import type { RouteSearchParams } from "./collections.ts";
import { parseMatchQuery, parseOpportunityQuery, parseShortlistQuery, serializeMatchQuery, serializeOpportunityQuery, serializeShortlistQuery } from "./collections.ts";

export type CollectionRoute = "/opportunities" | "/recommendations" | "/shortlist";

export function collectionHref(route: CollectionRoute, query: string, page?: number): string {
  const source = new URLSearchParams(query);
  if (page !== undefined) source.set("page", String(page));
  const normalized = route === "/opportunities" ? serializeOpportunityQuery(parseOpportunityQuery(source)) :
    route === "/recommendations" ? serializeMatchQuery(parseMatchQuery(source)) :
    serializeShortlistQuery(parseShortlistQuery(source));
  return `${route}?${normalized}`;
}

export type ScreenSearchProps = { searchParams: Promise<RouteSearchParams> };
