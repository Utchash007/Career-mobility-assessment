import { z } from "zod";
import { paginatedSchema, positiveIdSchema } from "./common.ts";
import {
  CRITERION_KEYS,
  CRITERION_STATUSES,
  type CriterionKey,
  type CriterionStatus,
  MATCH_LABELS,
  type MatchLabel,
  SEVERITIES,
  type Severity,
} from "./enums.ts";
import {
  type OpportunitySummary,
  opportunitySummarySchema,
} from "./opportunity.ts";

export interface CriterionResult {
  key: CriterionKey;
  weight: number;
  score: number | null;
  status: CriterionStatus;
  reason: string;
  evidence: Record<string, unknown>;
}

export interface EligibilityFlag {
  code: string;
  severity: Severity;
  message: string;
}

export interface MatchResult {
  opportunity_id: number;
  slug: string;
  title: string;
  overall_score: number | null;
  label: MatchLabel;
  criteria: CriterionResult[];
  flags: EligibilityFlag[];
  criteria_evaluated: number;
  criteria_total: 5;
  matcher_version: string;
}

export interface MatchListItem {
  opportunity: OpportunitySummary;
  match: MatchResult;
}

export const criterionResultSchema = z.strictObject({
  key: z.enum(CRITERION_KEYS),
  weight: z.number().min(0).max(1),
  score: z.number().min(0).max(1).nullable(),
  status: z.enum(CRITERION_STATUSES),
  reason: z.string(),
  // Evidence differs by criterion; display code must narrow each value before use.
  evidence: z.record(z.string(), z.unknown()),
}) satisfies z.ZodType<CriterionResult>;

export const eligibilityFlagSchema = z.strictObject({
  code: z.string(),
  severity: z.enum(SEVERITIES),
  message: z.string(),
}) satisfies z.ZodType<EligibilityFlag>;

export const matchResultSchema = z
  .strictObject({
    opportunity_id: positiveIdSchema,
    slug: z.string(),
    title: z.string(),
    overall_score: z.number().min(0).max(100).nullable(),
    label: z.enum(MATCH_LABELS),
    criteria: z.array(criterionResultSchema).length(5),
    flags: z.array(eligibilityFlagSchema),
    criteria_evaluated: z.number().int().min(0).max(5),
    criteria_total: z.literal(5),
    matcher_version: z.string(),
  })
  .superRefine((value, context) => {
    if (new Set(value.criteria.map((item) => item.key)).size !== 5) {
      context.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "A match must contain each of the five criteria exactly once.",
      });
    }
  }) satisfies z.ZodType<MatchResult>;

export const matchListItemSchema = z
  .strictObject({
    opportunity: opportunitySummarySchema,
    match: matchResultSchema,
  })
  .superRefine((value, context) => {
    if (value.opportunity.id !== value.match.opportunity_id) {
      context.addIssue({
        code: "custom",
        path: ["match", "opportunity_id"],
        message: "Match and opportunity IDs must agree.",
      });
    }
  }) satisfies z.ZodType<MatchListItem>;

export const matchPageSchema = paginatedSchema(matchListItemSchema);
