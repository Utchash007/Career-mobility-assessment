"use client";

import { Button } from "flowbite-react";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import LanguageRow from "@/components/LanguageRow/LanguageRow";
import { createLanguageDraft, type LanguageDraft } from "@/lib/forms/profile-draft.ts";
import type { FieldErrors } from "@/lib/forms/errors.ts";

export default function LanguageFields({ value, onChange, errors }: { value: LanguageDraft[]; onChange: (value: LanguageDraft[]) => void; errors: FieldErrors }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 text-xl font-semibold">Languages</legend>
      <p className="text-sm">Declare each language once, with its level. Up to 10 languages.</p>
      {value.map((row, index) => <LanguageRow key={row.id} value={row} index={index} errors={errors}
        onChange={(next) => onChange(value.map((item) => item.id === row.id ? next : item))}
        onRemove={() => onChange(value.filter((item) => item.id !== row.id))} />)}
      <Button type="button" color="alternative" data-field="languages" disabled={value.length >= 10} onClick={() => onChange([...value, createLanguageDraft(`language-${crypto.randomUUID()}`)])}>Add language</Button>
      <FieldFeedback id="languages-help" error={errors.languages} />
    </fieldset>
  );
}
