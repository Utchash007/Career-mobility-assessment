"use client";

import { Label, Textarea } from "flowbite-react";
import CountryChoices from "@/components/CountryChoices/CountryChoices";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import { type FieldErrors, fieldError } from "@/lib/forms/errors.ts";

export default function PreferenceFields({
  locations,
  interests,
  onLocationsChange,
  onInterestsChange,
  errors,
}: {
  locations: string[];
  interests: string;
  onLocationsChange: (value: string[]) => void;
  onInterestsChange: (value: string) => void;
  errors: FieldErrors;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 text-xl font-semibold">Preferences</legend>
      <CountryChoices
        id="preferred-locations"
        field="preferred_locations"
        label="Preferred locations (up to 10)"
        value={locations}
        onChange={onLocationsChange}
        error={fieldError(errors, "preferred_locations")}
      />
      <div className="space-y-2">
        <Label htmlFor="career-interests">Career interests</Label>
        <Textarea
          id="career-interests"
          data-field="career_interests"
          rows={3}
          value={interests}
          onChange={(event) => onInterestsChange(event.target.value)}
          aria-invalid={Boolean(errors.career_interests)}
          aria-describedby="career-interests-help"
        />
        <FieldFeedback
          id="career-interests-help"
          error={fieldError(errors, "career_interests")}
          hint="Comma-separated interests; up to 15 unique keys. Preferences are not eligibility declarations."
        />
      </div>
    </fieldset>
  );
}
