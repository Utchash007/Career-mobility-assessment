"use client";

import { Alert, Label, Select } from "flowbite-react";
import CountryChoices from "@/components/CountryChoices/CountryChoices";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import { WORK_AUTHORISATION_STATUSES, type WorkAuthorisationStatus } from "@/lib/contracts/enums.ts";
import { WORK_AUTHORISATION_LABELS, WORK_AUTHORISATION_NOTICE } from "@/lib/display/labels.ts";
import { fieldError, type FieldErrors } from "@/lib/forms/errors.ts";
import type { ProfileDraft } from "@/lib/forms/profile-draft.ts";

export default function WorkAuthorisationFields({ value, onChange, errors }: { value: ProfileDraft["workAuthorisation"]; onChange: (value: ProfileDraft["workAuthorisation"]) => void; errors: FieldErrors }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 text-xl font-semibold">Work authorisation</legend>
      <Alert color="warning">{WORK_AUTHORISATION_NOTICE}. This is not legal advice or proof of permission to work.</Alert>
      <div className="space-y-2">
        <Label htmlFor="work-status">Self-declared status</Label>
        <Select id="work-status" data-field="work_authorisation.status" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as WorkAuthorisationStatus })} aria-invalid={Boolean(errors["work_authorisation.status"])} aria-describedby="work-status-help">
          {WORK_AUTHORISATION_STATUSES.map((status) => <option key={status} value={status}>{WORK_AUTHORISATION_LABELS[status]}</option>)}
        </Select>
        <FieldFeedback id="work-status-help" error={errors["work_authorisation.status"]} hint="Not declared needs no countries. Every declared status needs at least one country; changing status does not silently erase your selections." />
      </div>
      <CountryChoices id="work-countries" field="work_authorisation.countries" label="Countries covered by this declaration" value={value.countries} onChange={(countries) => onChange({ ...value, countries })} error={fieldError(errors, "work_authorisation.countries")} />
    </fieldset>
  );
}
