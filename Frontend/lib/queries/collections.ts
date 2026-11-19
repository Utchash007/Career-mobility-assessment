import { z } from "zod";
import { textSchema } from "../contracts/common.ts";
import {
  MATCH_LABELS,
  type MatchLabel,
  OPPORTUNITY_TYPES,
  type OpportunityType,
  WORK_MODES,
  type WorkMode,
} from "../contracts/enums.ts";
import { exactCountryCodeSchema } from "../forms/normalise.ts";

export const OPPORTUNITY_SORTS = ["id_asc", "title_asc", "title_desc"] as const;
export type OpportunitySort = (typeof OPPORTUNITY_SORTS)[number];
export const SHORTLIST_SORTS = [
  "created_at_desc",
  "created_at_asc",
  "title_asc",
] as const;
export type ShortlistSort = (typeof SHORTLIST_SORTS)[number];

export interface CollectionQuery {
  page: number;
  page_size: number;
  q?: string;
  country?: string;
  type?: OpportunityType;
  work_mode?: WorkMode;
}

export interface OpportunityQuery extends CollectionQuery {
  sort: OpportunitySort;
}

export interface MatchQuery extends CollectionQuery {
  label?: MatchLabel;
}

export interface ShortlistQuery extends CollectionQuery {
  sort: ShortlistSort;
}

export type RouteSearchParams = Record<string, string | string[] | undefined>;
export type QuerySource = URLSearchParams | RouteSearchParams;

export interface CollectionFilterDraft {
  q: string;
  country: string;
  type: OpportunityType | "";
  work_mode: WorkMode | "";
  page_size: string;
}

const integerInputSchema = z
  .union([
    z
      .string()
      .regex(/^[0-9]+$(?![\s\S])/, "Use an integer.")
      .transform(Number),
    z.number(),
  ])
  .pipe(z.number().int().min(1).safe());

const collectionShape = {
  page: integerInputSchema.default(1),
  page_size: integerInputSchema.pipe(z.number().max(100)).default(10),
  q: textSchema(100).optional(),
  country: exactCountryCodeSchema.optional(),
  type: z.enum(OPPORTUNITY_TYPES).optional(),
  work_mode: z.enum(WORK_MODES).optional(),
};

export const opportunityQuerySchema = z.strictObject({
  ...collectionShape,
  sort: z.enum(OPPORTUNITY_SORTS).default("id_asc"),
}) satisfies z.ZodType<OpportunityQuery>;

export const matchQuerySchema = z.strictObject({
  ...collectionShape,
  label: z.enum(MATCH_LABELS).optional(),
}) satisfies z.ZodType<MatchQuery>;

export const shortlistQuerySchema = z.strictObject({
  ...collectionShape,
  sort: z.enum(SHORTLIST_SORTS).default("created_at_desc"),
}) satisfies z.ZodType<ShortlistQuery>;

function queryObject(source: QuerySource): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
  const entries =
    source instanceof URLSearchParams ? source.entries() : Object.entries(source);
  for (const [name, value] of entries) {
    if (value === undefined) continue;
    if (Object.hasOwn(result, name) || Array.isArray(value)) {
      throw new z.ZodError([
        {
          code: "custom",
          path: [name],
          message: "Supply each query parameter only once.",
        },
      ]);
    }
    result[name] = value;
  }
  return result;
}

export function parseOpportunityQuery(source: QuerySource): OpportunityQuery {
  return opportunityQuerySchema.parse(queryObject(source));
}

export function parseMatchQuery(source: QuerySource): MatchQuery {
  return matchQuerySchema.parse(queryObject(source));
}

export function parseShortlistQuery(source: QuerySource): ShortlistQuery {
  return shortlistQuerySchema.parse(queryObject(source));
}

function serializeQuery(query: CollectionQuery & { sort?: string; label?: string }) {
  const result = new URLSearchParams();
  result.set("page", String(query.page));
  result.set("page_size", String(query.page_size));
  for (const name of [
    "q",
    "country",
    "type",
    "work_mode",
    "sort",
    "label",
  ] as const) {
    const value = query[name];
    if (value !== undefined) result.set(name, value);
  }
  return result;
}

export function serializeOpportunityQuery(
  query: OpportunityQuery,
): URLSearchParams {
  return serializeQuery(opportunityQuerySchema.parse(query));
}

export function serializeMatchQuery(query: MatchQuery): URLSearchParams {
  return serializeQuery(matchQuerySchema.parse(query));
}

export function serializeShortlistQuery(query: ShortlistQuery): URLSearchParams {
  return serializeQuery(shortlistQuerySchema.parse(query));
}

function appliedFilters(draft: CollectionFilterDraft) {
  // Blank form choices are omitted; blank parameters in an actual URL still fail.
  return {
    page: 1,
    page_size: draft.page_size,
    q: draft.q.trim() || undefined,
    country: draft.country || undefined,
    type: draft.type || undefined,
    work_mode: draft.work_mode || undefined,
  };
}

export function applyOpportunityFilters(
  draft: CollectionFilterDraft & { sort: OpportunitySort },
): URLSearchParams {
  return serializeQuery(
    opportunityQuerySchema.parse({ ...appliedFilters(draft), sort: draft.sort }),
  );
}

export function applyMatchFilters(
  draft: CollectionFilterDraft & { label: MatchLabel | "" },
): URLSearchParams {
  return serializeQuery(
    matchQuerySchema.parse({
      ...appliedFilters(draft),
      label: draft.label || undefined,
    }),
  );
}

export function applyShortlistFilters(
  draft: CollectionFilterDraft & { sort: ShortlistSort },
): URLSearchParams {
  return serializeQuery(
    shortlistQuerySchema.parse({ ...appliedFilters(draft), sort: draft.sort }),
  );
}
