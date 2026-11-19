"use client";

import { Alert, Button } from "flowbite-react";
import { ERROR_COPY, type ErrorReason } from "@/lib/display/feedback.ts";

export interface ErrorStateProps {
  reason?: ErrorReason;
  onRetry?: () => void;
  retryState?: "idle" | "pending";
}

export default function ErrorState({
  reason = "unexpected",
  onRetry,
  retryState = "idle",
}: ErrorStateProps) {
  const copy = ERROR_COPY[reason] ?? ERROR_COPY.unexpected;
  const pending = retryState === "pending";

  return (
    <Alert color="failure" role="alert" aria-atomic="true" withBorderAccent>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <p className="max-w-2xl text-sm leading-6">{copy.description}</p>
        {onRetry ? (
          <Button
            type="button"
            color="alternative"
            size="sm"
            onClick={onRetry}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Retrying…" : "Try again"}
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
