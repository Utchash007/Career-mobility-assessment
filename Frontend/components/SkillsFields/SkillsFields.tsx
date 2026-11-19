"use client";

import { Badge, Label, Textarea } from "flowbite-react";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import { keyLabel } from "@/lib/display/labels.ts";
import { splitKeyInput, skillKeySchema } from "@/lib/forms/normalise.ts";

export default function SkillsFields({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const preview = [...new Set(splitKeyInput(value).flatMap((key) => {
    const parsed = skillKeySchema.safeParse(key);
    return parsed.success ? [parsed.data] : [];
  }))];
  return (
    <fieldset className="space-y-3">
      <legend className="mb-4 text-xl font-semibold">Skills</legend>
      <Label htmlFor="skills">Comma-separated skills</Label>
      <Textarea id="skills" data-field="skills" rows={3} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby="skills-help" />
      <FieldFeedback id="skills-help" error={error} hint="Up to 30 distinct skills. Spaces become underscores; known aliases are normalized by the contract." />
      <div aria-label="Normalized skill preview" className="flex flex-wrap gap-2">{preview.map((key) => <Badge key={key} color="info">{keyLabel(key)}</Badge>)}</div>
    </fieldset>
  );
}
