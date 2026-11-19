import type { ApiClient } from "./client.ts";
import { asApiFailure, isMissingProfile, type FailureReason } from "./errors.ts";
import type { MatchResult } from "../contracts/match.ts";

export type DetailMatchState = { status: "available"; match: MatchResult } |
  { status: "profile_required" } | { status: "error"; reason: FailureReason };

export async function loadOpportunityDetail(api: ApiClient, id: number) {
  const opportunity = api.getOpportunity(id);
  const match = api.getProfile().then(() => api.getMatch(id)).then(
    (value): DetailMatchState => ({ status: "available", match: value }),
    (error): DetailMatchState => isMissingProfile(error) ? { status: "profile_required" } : { status: "error", reason: asApiFailure(error).reason },
  );
  const [role, fit] = await Promise.allSettled([opportunity, match]);
  return { opportunity: role, match: fit.status === "fulfilled" ? fit.value : { status: "error", reason: asApiFailure(fit.reason).reason } as DetailMatchState };
}
