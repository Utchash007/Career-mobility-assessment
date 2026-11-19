import { z } from "zod";
import { positiveIdSchema } from "./common.ts";

export const API_PATHS = {
  health: "/health",
  profile: "/api/v1/profile",
  sampleProfile: "/api/v1/profile/sample",
  opportunities: "/api/v1/opportunities",
  matches: "/api/v1/matches",
  shortlist: "/api/v1/shortlist",
  me: "/api/v1/me",
} as const;

const routeIdSchema = z
  .union([
    z
      .string()
      .regex(/^[0-9]+$(?![\s\S])/, "Use a positive integer opportunity ID.")
      .transform(Number),
    z.number(),
  ])
  .pipe(positiveIdSchema);

export function parseOpportunityId(value: string | number): number {
  return routeIdSchema.parse(value);
}

export function opportunityPath(id: number): string {
  return `${API_PATHS.opportunities}/${positiveIdSchema.parse(id)}`;
}

export function matchPath(id: number): string {
  return `${API_PATHS.matches}/${positiveIdSchema.parse(id)}`;
}

export function shortlistPath(id: number): string {
  return `${API_PATHS.shortlist}/${positiveIdSchema.parse(id)}`;
}
