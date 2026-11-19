"use client";

import { Alert, Button } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import ConfirmationDialog from "@/components/ConfirmationDialog/ConfirmationDialog";
import ProfileIdentityFields from "@/components/ProfileIdentityFields/ProfileIdentityFields";
import EducationFields from "@/components/EducationFields/EducationFields";
import ExperienceFields from "@/components/ExperienceFields/ExperienceFields";
import SkillsFields from "@/components/SkillsFields/SkillsFields";
import LanguageFields from "@/components/LanguageFields/LanguageFields";
import PreferenceFields from "@/components/PreferenceFields/PreferenceFields";
import WorkAuthorisationFields from "@/components/WorkAuthorisationFields/WorkAuthorisationFields";
import SampleProfileAction from "@/components/SampleProfileAction/SampleProfileAction";
import { useApi } from "@/hooks/useApi";
import { useOperation } from "@/hooks/useOperation";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { type ApiFailure, isMissingProfile } from "@/lib/api/errors.ts";
import type { ProfileRead } from "@/lib/contracts/profile.ts";
import type { FieldErrors } from "@/lib/forms/errors.ts";
import { focusInvalidField } from "@/lib/forms/focus.ts";
import { createProfileDraft, parseProfileDraft } from "@/lib/forms/profile-draft.ts";

export default function ProfileForm({ initialProfile, displayName, today }: { initialProfile: ProfileRead | null; displayName: string; today: string }) {
  const api = useApi();
  const router = useRouter();
  const operation = useOperation("profile");
  const form = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(initialProfile);
  const [draft, setDraft] = useState(() => createProfileDraft(initialProfile));
  const [fields, setFields] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [message, setMessage] = useState("");
  const [sampleOpen, setSampleOpen] = useState(false);
  const [reloadOpen, setReloadOpen] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(createProfileDraft(saved));
  useUnsavedChanges(dirty);
  const blocked = operation.pending || Boolean(failure?.unconfirmed);

  function accept(profile: ProfileRead | null, description: string) {
    setSaved(profile);
    setDraft(createProfileDraft(profile));
    setFields({});
    setFailure(null);
    setMessage(description);
    setSampleOpen(false);
    setReloadOpen(false);
    router.refresh();
  }
  function reject(error: ApiFailure) {
    setFailure(error);
    setFields(error.fields);
    setSampleOpen(false);
    setReloadOpen(false);
    focusInvalidField(form.current, error.fields);
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked) return;
    const parsed = parseProfileDraft(draft, displayName);
    setMessage("");
    if (!parsed.success) {
      setFields(parsed.fields);
      focusInvalidField(form.current, parsed.fields);
      return;
    }
    setFields({});
    setFailure(null);
    void operation.run(() => api.saveProfile(parsed.data), (profile) => accept(profile, "Your profile is saved. Matches use the updated snapshot."), reject);
  }
  function reload() {
    void operation.run(async () => {
      try { return await api.getProfile(); } catch (error) { if (isMissingProfile(error)) return null; throw error; }
    }, (profile) => accept(profile, "Loaded the current saved state. No new write was made."), reject);
  }
  if (failure?.reason === "session_expired") return <ApiFeedback reason="session_expired" />;
  return (
    <form ref={form} onSubmit={save} noValidate className="max-w-4xl space-y-8" aria-busy={operation.pending}>
      {!saved ? <Alert color="info">No application profile has been saved. Complete this form or deliberately load the fictional sample.</Alert> : null}
      {initialProfile?.updated_at !== saved?.updated_at && dirty ? <Alert color="warning">Saved data may have changed. Your unsaved edits are retained; reload saved state to review before replacing it.</Alert> : null}
      <fieldset disabled={operation.pending} className="space-y-8">
        <ProfileIdentityFields displayName={displayName} storedName={saved?.full_name} birthday={draft.birthday} today={today} errors={fields} onBirthdayChange={(birthday) => setDraft({ ...draft, birthday })} />
        <EducationFields value={draft.education} errors={fields} onChange={(education) => setDraft({ ...draft, education })} />
        <ExperienceFields value={draft.experienceYears} error={fields.experience_years} onChange={(experienceYears) => setDraft({ ...draft, experienceYears })} />
        <SkillsFields value={draft.skillsText} error={fields.skills ?? Object.entries(fields).find(([key]) => key.startsWith("skills."))?.[1]} onChange={(skillsText) => setDraft({ ...draft, skillsText })} />
        <LanguageFields value={draft.languages} errors={fields} onChange={(languages) => { setDraft({ ...draft, languages }); setFields({}); }} />
        <PreferenceFields locations={draft.preferredLocations} interests={draft.careerInterestsText} errors={fields} onLocationsChange={(preferredLocations) => setDraft({ ...draft, preferredLocations })} onInterestsChange={(careerInterestsText) => setDraft({ ...draft, careerInterestsText })} />
        <WorkAuthorisationFields value={draft.workAuthorisation} errors={fields} onChange={(workAuthorisation) => setDraft({ ...draft, workAuthorisation })} />
      </fieldset>
      {Object.keys(fields).length > 0 ? <Alert color="failure">Review the highlighted fields. Your draft has been preserved.</Alert> : null}
      {failure ? <ApiFeedback reason={failure.reason} /> : null}
      {failure?.unconfirmed ? <Alert color="warning">The write outcome is unconfirmed. Reload saved state before trying another write; the request may already have been applied.</Alert> : null}
      <p role="status" aria-live="polite" className="min-h-6 text-sm text-action">{operation.pending ? "Please wait…" : message || (dirty ? "Unsaved changes" : "No unsaved changes")}</p>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={blocked}>Save complete profile</Button>
        <SampleProfileAction open={sampleOpen} pending={operation.pending} disabled={blocked} onOpen={() => setSampleOpen(true)} onCancel={() => setSampleOpen(false)} onConfirm={() => { setMessage(""); void operation.run(() => api.sampleProfile(), (profile) => accept(profile, "Fictional sample saved. Clerk identity and shortlist were not changed."), reject); }} />
        <Button type="button" color="alternative" disabled={operation.pending} onClick={() => dirty ? setReloadOpen(true) : reload()}>Reload saved state</Button>
      </div>
      <ConfirmationDialog open={reloadOpen} title="Discard unsaved edits?" description="Reloading reads the current saved profile and replaces this form’s unsaved draft. It makes no write." confirmLabel="Discard draft and reload" state={operation.pending ? "pending" : "idle"} onCancel={() => setReloadOpen(false)} onConfirm={reload} />
    </form>
  );
}
