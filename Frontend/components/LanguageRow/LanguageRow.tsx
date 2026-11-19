"use client";

import { Button, Label, Select } from "flowbite-react";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import { LANGUAGE_CODES } from "@/lib/contracts/codes.ts";
import { LANGUAGE_LEVELS, type LanguageLevel } from "@/lib/contracts/enums.ts";
import { languageLabel, LANGUAGE_LEVEL_LABELS } from "@/lib/display/labels.ts";
import type { LanguageDraft } from "@/lib/forms/profile-draft.ts";
import type { FieldErrors } from "@/lib/forms/errors.ts";

export default function LanguageRow({ value, index, onChange, onRemove, errors }: { value: LanguageDraft; index: number; onChange: (value: LanguageDraft) => void; onRemove: () => void; errors: FieldErrors }) {
  const prefix = `languages.${index}`;
  return (
    <div className="grid items-start gap-3 rounded-xl border border-accent/25 p-4 sm:grid-cols-[1fr_1fr_auto]">
      <div className="space-y-2">
        <Label htmlFor={`${value.id}-language`}>Language {index + 1}</Label>
        <Select id={`${value.id}-language`} data-field={`${prefix}.language`} value={value.language} onChange={(event) => onChange({ ...value, language: event.target.value })} aria-invalid={Boolean(errors[`${prefix}.language`])} aria-describedby={`${value.id}-language-help`}>
          <option value="">Choose a language</option>
          {LANGUAGE_CODES.map((code) => <option key={code} value={code}>{languageLabel(code)} ({code})</option>)}
        </Select>
        <FieldFeedback id={`${value.id}-language-help`} error={errors[`${prefix}.language`]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${value.id}-level`}>Proficiency</Label>
        <Select id={`${value.id}-level`} data-field={`${prefix}.level`} value={value.level} onChange={(event) => onChange({ ...value, level: event.target.value as LanguageLevel | "" })} aria-invalid={Boolean(errors[`${prefix}.level`])} aria-describedby={`${value.id}-level-help`}>
          <option value="">Choose a level</option>
          {LANGUAGE_LEVELS.map((level) => <option key={level} value={level}>{LANGUAGE_LEVEL_LABELS[level]}</option>)}
        </Select>
        <FieldFeedback id={`${value.id}-level-help`} error={errors[`${prefix}.level`]} />
      </div>
      <Button type="button" color="alternative" onClick={onRemove} aria-label={`Remove language ${index + 1}`} className="sm:mt-7">Remove</Button>
    </div>
  );
}
