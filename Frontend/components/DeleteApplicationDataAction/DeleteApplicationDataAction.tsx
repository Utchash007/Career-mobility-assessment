"use client";

import { Alert, Button } from "flowbite-react";
import { useState } from "react";
import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import ConfirmationDialog from "@/components/ConfirmationDialog/ConfirmationDialog";
import { useApi } from "@/hooks/useApi";
import { useOperation } from "@/hooks/useOperation";
import type { ApiFailure } from "@/lib/api/errors.ts";

export default function DeleteApplicationDataAction() {
  const api = useApi();
  const operation = useOperation("application-data");
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [deleted, setDeleted] = useState(false);
  return (
    <div className="space-y-4">
      <Alert color="warning">
        Deletes your application profile, birthday, shortlist and notes. Your
        Clerk identity/session and the opportunity catalog are not deleted.
      </Alert>
      {failure ? <ApiFeedback reason={failure.reason} /> : null}
      {failure ? (
        <p className="text-sm text-critical">
          Deletion has not been confirmed. An unavailable or interrupted
          response is not proof of deletion. You may deliberately retry this
          idempotent action.
        </p>
      ) : null}
      <Button
        type="button"
        color="failure"
        disabled={operation.pending || deleted}
        onClick={() => setOpen(true)}
      >
        Delete my application data
      </Button>
      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {deleted
          ? "Application-data deletion confirmed. Returning to profile setup…"
          : operation.pending
            ? "Waiting for pending work or deleting application data…"
            : ""}
      </p>
      <ConfirmationDialog
        open={open}
        title="Delete your application data?"
        description="This permanently removes your application profile and all saved opportunities/private notes. Clerk stays signed in. The interface will reload to discard client drafts and stale views. This does not delete your Clerk account."
        confirmLabel="Delete my application data"
        intent="destructive"
        state={operation.pending ? "pending" : "idle"}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          void operation.run(
            () => api.deleteApplicationData(),
            () => {
              setDeleted(true);
              setFailure(null);
              // A fresh document discards the entire React tree and router cache, not
              // just the visible page. The destination is fixed and contains no data.
              window.location.replace("/profile");
            },
            (error) => {
              setFailure(error);
              setOpen(false);
            },
          );
        }}
      />
    </div>
  );
}
