"use client";

import { Label, TextInput } from "flowbite-react";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import type { FieldErrors } from "@/lib/forms/errors.ts";

export default function ProfileIdentityFields({ displayName, storedName, birthday, today, onBirthdayChange, errors }: {
  displayName: string; storedName?: string; birthday: string; today: string;
  onBirthdayChange: (value: string) => void; errors: FieldErrors;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 text-xl font-semibold">Identity</legend>
      <div className="space-y-2">
        <Label htmlFor="full-name">Name from Clerk</Label>
        <TextInput id="full-name" data-field="full_name" value={displayName} readOnly aria-describedby="full-name-help" aria-invalid={Boolean(errors.full_name)} />
        <FieldFeedback id="full-name-help" error={errors.full_name} hint="Manage your identity with Clerk. Personal profile saves use this name." />
        {storedName && storedName !== displayName ? <p className="text-sm text-verification">Saved application name: {storedName}. Sample content can use a fictional name; this does not change your Clerk identity.</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthday">Birthday (optional)</Label>
        <TextInput id="birthday" data-field="birthday" type="date" min="1900-01-01" max={today} value={birthday} onChange={(event) => onBirthdayChange(event.target.value)} aria-invalid={Boolean(errors.birthday)} aria-describedby="birthday-help" />
        <FieldFeedback id="birthday-help" error={errors.birthday} hint="Application data only; birthday is not used for matching. Leave blank if unspecified." />
      </div>
    </fieldset>
  );
}
