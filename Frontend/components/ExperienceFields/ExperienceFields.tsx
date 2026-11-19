"use client";

import { Label, TextInput } from "flowbite-react";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";

export default function ExperienceFields({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-4 text-xl font-semibold">Experience</legend>
      <Label htmlFor="experience-years">Years of relevant experience</Label>
      <TextInput
        id="experience-years"
        data-field="experience_years"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby="experience-years-help"
      />
      <FieldFeedback
        id="experience-years-help"
        error={error}
        hint="Whole years from 0 to 60. Blank means unspecified; 0 means no experience."
      />
    </fieldset>
  );
}
