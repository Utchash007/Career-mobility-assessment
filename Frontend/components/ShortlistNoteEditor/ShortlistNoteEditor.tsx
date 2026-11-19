"use client";

import { Alert, Button, Label, Textarea } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import { useApi } from "@/hooks/useApi";
import { useOperation } from "@/hooks/useOperation";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { ApiFailure, isMissingProfile } from "@/lib/api/errors.ts";
import { readSavedItem } from "@/lib/api/saved-item.ts";
import { characterCount } from "@/lib/contracts/common.ts";
import { noteSchema, type ShortlistItem } from "@/lib/contracts/shortlist.ts";
import {
  acceptNoteSave,
  createNoteDraft,
  refreshNoteDraft,
} from "@/lib/forms/note-draft.ts";

export default function ShortlistNoteEditor({ item }: { item: ShortlistItem }) {
  const api = useApi();
  const router = useRouter();
  const operation = useOperation(`shortlist-${item.opportunity_id}`);
  const input = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState(() => createNoteDraft(item));
  const saved = state.saved.note;
  const draft = state.draft;
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const dirty = draft !== saved;
  useUnsavedChanges(dirty);
  if (
    item.updated_at !== state.observedVersion &&
    !operation.pending &&
    !failure?.unconfirmed
  )
    setState(refreshNoteDraft(state, item));
  function accept(next: ShortlistItem) {
    setState((current) => acceptNoteSave(current, next));
    setFailure(null);
    setError(undefined);
    setMessage("Saved note state confirmed.");
    router.refresh();
  }
  if (failure?.reason === "session_expired")
    return <ApiFeedback reason="session_expired" />;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (operation.pending || failure?.unconfirmed) return;
        const parsed = noteSchema.safeParse(draft);
        if (!parsed.success) {
          setError("Use at most 500 characters.");
          input.current?.focus();
          return;
        }
        setError(undefined);
        setMessage("");
        setFailure(null);
        void operation.run(
          () => api.updateNote(item.opportunity_id, parsed.data),
          accept,
          setFailure,
        );
      }}
      className="space-y-3"
      aria-busy={operation.pending}
    >
      <Label htmlFor={`note-${item.opportunity_id}`}>Private note</Label>
      <Textarea
        ref={input}
        id={`note-${item.opportunity_id}`}
        rows={4}
        value={draft}
        disabled={operation.pending}
        onChange={(event) => setState({ ...state, draft: event.target.value })}
        aria-invalid={Boolean(error)}
        aria-describedby={`note-${item.opportunity_id}-help`}
      />
      <FieldFeedback
        id={`note-${item.opportunity_id}-help`}
        error={error}
        hint={`${characterCount(draft)} / 500 characters. Save an empty string to deliberately clear the note.`}
      />
      {Date.parse(item.updated_at) > Date.parse(state.saved.updated_at) &&
      dirty ? (
        <Alert color="warning">
          The saved note changed; your unsaved edits are retained.
        </Alert>
      ) : null}
      {failure ? (
        <ApiFeedback
          reason={failure.reason}
          profileRequired={isMissingProfile(failure)}
        />
      ) : null}
      {failure?.unconfirmed ? (
        <Alert color="warning">
          The note write is unconfirmed. Check saved note state before repeating
          it; checking replaces this unsaved draft.
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={
            operation.pending ||
            !dirty ||
            Boolean(failure?.unconfirmed) ||
            failure?.status === 404
          }
        >
          Save note
        </Button>
        {failure?.unconfirmed ? (
          <Button
            type="button"
            color="alternative"
            disabled={operation.pending}
            onClick={() => {
              void operation.run(
                () =>
                  readSavedItem(
                    api,
                    item.opportunity_id,
                    item.opportunity.title,
                  ),
                accept,
                (error) =>
                  setFailure(
                    new ApiFailure(
                      error.reason,
                      error.status,
                      error.code,
                      error.fields,
                      error.status !== 404,
                    ),
                  ),
              );
            }}
          >
            Replace draft with saved note
          </Button>
        ) : null}
        {failure?.status === 404 ? (
          <Button
            type="button"
            color="alternative"
            onClick={() => router.refresh()}
          >
            Refresh shortlist
          </Button>
        ) : null}
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-xs">
        {message || (dirty ? "Unsaved note edits" : "No unsaved note edits")}
      </p>
    </form>
  );
}
