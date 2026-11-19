import { parseOpportunityId } from "../contracts/endpoints.ts";
import type { RouteSearchParams } from "./collections.ts";
import { collectionHref, type CollectionRoute } from "./navigation.ts";

export interface DetailContext { route: CollectionRoute; query: string }

export function opportunityDetailHref(id: number, context?: DetailContext): string {
  const path = `/opportunities/${parseOpportunityId(id)}`;
  if (!context) return path;
  const validated = new URL(collectionHref(context.route, context.query), "https://internal.invalid");
  const query = new URLSearchParams({ from: context.route.slice(1), query: validated.searchParams.toString() });
  return `${path}?${query}`;
}

export function detailReturnHref(params: RouteSearchParams): string {
  if (Object.keys(params).some((key) => !["from", "query"].includes(key))) return "/opportunities";
  if (typeof params.from !== "string" || typeof params.query !== "string") return "/opportunities";
  if (!["opportunities", "recommendations", "shortlist"].includes(params.from)) return "/opportunities";
  try { return collectionHref(`/${params.from}` as CollectionRoute, params.query); } catch { return "/opportunities"; }
}

export interface DetailScreenProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<RouteSearchParams>;
}
