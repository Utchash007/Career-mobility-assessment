"use client";

import { Alert, Button } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import ConfirmationDialog from "@/components/ConfirmationDialog/ConfirmationDialog";
import { useApi } from "@/hooks/useApi";
import { useOperation } from "@/hooks/useOperation";
import { ApiFailure, isMissingProfile } from "@/lib/api/errors.ts";

export default function ShortlistAction({
  opportunityId,
  initialSaved,
}: {
  opportunityId: number;
  initialSaved: boolean;
}) {
  const api = useApi();
  const router = useRouter();
  const operation = useOperation(`shortlist-${opportunityId}`);
  const [seen, setSeen] = useState(initialSaved);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  if (seen !== initialSaved && !operation.pending && !failure?.unconfirmed) {
    setSeen(initialSaved);
    setOptimistic(null);
  }
  const saved = optimistic ?? initialSaved;

  function reconcile() {
    void operation.run(
      () => api.getOpportunity(opportunityId),
      (role) => {
        setOptimistic(role.is_shortlisted);
        setFailure(null);
        setRefreshFailed(false);
        setMessage(
          role.is_shortlisted
            ? "Saved state confirmed."
            : "Not currently saved.",
        );
        router.refresh();
      },
      (error) => {
        setFailure(
          (previous) =>
            new ApiFailure(
              error.reason,
              error.status,
              error.code,
              error.fields,
              Boolean(previous?.unconfirmed),
            ),
        );
      },
    );
  }
  function write(next: boolean) {
    if (operation.pending || failure?.unconfirmed) return;
    const previous = saved;
    void operation.run(
      async () => {
        setOptimistic(next);
        setFailure(null);
        setMessage("");
        setRefreshFailed(false);
        if (next) await api.saveShortlist(opportunityId, {});
        else await api.removeShortlist(opportunityId);
        try {
          return {
            saved: (await api.getOpportunity(opportunityId)).is_shortlisted,
            refreshFailed: false,
          };
        } catch {
          return { saved: next, refreshFailed: true };
        }
      },
      (result) => {
        setOptimistic(result.saved);
        setRemoveOpen(false);
        setRefreshFailed(result.refreshFailed);
        setMessage(
          result.refreshFailed
            ? `${next ? "Save" : "Removal"} confirmed; refreshing current state failed.`
            : result.saved
              ? "Opportunity is saved."
              : "Opportunity removed.",
        );
        router.refresh();
      },
      (error) => {
        setOptimistic(error.unconfirmed ? null : previous);
        setRemoveOpen(false);
        setFailure(error);
      },
    );
  }
  return (
    <div className="space-y-3">
      {failure ? (
        <ApiFeedback
          reason={failure.reason}
          profileRequired={isMissingProfile(failure)}
        />
      ) : null}
      {failure?.unconfirmed ? (
        <Alert color="warning">
          Saved state is unconfirmed. The write may have reached the service;
          check before repeating it.
        </Alert>
      ) : null}
      <Button
        type="button"
        color={saved ? "alternative" : "default"}
        disabled={operation.pending || Boolean(failure?.unconfirmed)}
        onClick={() => (saved ? setRemoveOpen(true) : write(true))}
        aria-pressed={failure?.unconfirmed ? undefined : saved}
      >
        {operation.pending
          ? "Working…"
          : failure?.unconfirmed
            ? "State unconfirmed"
            : saved
              ? "Remove from shortlist"
              : "Save to shortlist"}
      </Button>
      {failure?.unconfirmed || refreshFailed ? (
        <Button
          type="button"
          color="alternative"
          disabled={operation.pending}
          onClick={reconcile}
        >
          Check saved state
        </Button>
      ) : null}
      <p role="status" aria-live="polite" className="min-h-5 text-xs">
        {message}
      </p>
      <ConfirmationDialog
        open={removeOpen}
        title="Remove this saved opportunity?"
        description="This removes the saved opportunity and its private note. Unsaved note edits will be lost. It does not remove the opportunity from the catalog."
        confirmLabel="Remove from shortlist"
        intent="destructive"
        state={operation.pending ? "pending" : "idle"}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={() => write(false)}
      />
    </div>
  );
}
