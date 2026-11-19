import type { ErrorReason } from "../display/feedback.ts";
import type { FieldErrors } from "../forms/errors.ts";

export type FailureReason = ErrorReason | "configuration" | "cancelled";

// Only safe metadata crosses UI boundaries. Never retain response text or tokens.
export class ApiFailure extends Error {
  readonly reason: FailureReason;
  readonly status: number;
  readonly code: string;
  readonly fields: FieldErrors;
  readonly unconfirmed: boolean;

  constructor(
    reason: FailureReason,
    status = 0,
    code = "",
    fields: FieldErrors = {},
    unconfirmed = false,
  ) {
    super("The application request could not be completed.");
    this.name = "ApiFailure";
    this.reason = reason;
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.unconfirmed = unconfirmed;
  }
}

export function asApiFailure(error: unknown): ApiFailure {
  return error instanceof ApiFailure ? error : new ApiFailure("unexpected");
}

export function isMissingProfile(error: unknown): boolean {
  return error instanceof ApiFailure &&
    ((error.status === 404 && error.code === "PROFILE_NOT_FOUND") ||
      (error.status === 409 && error.code === "PROFILE_REQUIRED"));
}
