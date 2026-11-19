"use client";

import { Label, Select, TextInput } from "flowbite-react";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import {
  EDUCATION_LEVELS,
  type EducationLevel,
} from "@/lib/contracts/enums.ts";
import { EDUCATION_LABELS } from "@/lib/display/labels.ts";
import type { FieldErrors } from "@/lib/forms/errors.ts";
import type {
  EnrolmentDraft,
  ProfileDraft,
} from "@/lib/forms/profile-draft.ts";

export default function EducationFields({
  value,
  onChange,
  errors,
}: {
  value: ProfileDraft["education"];
  onChange: (value: ProfileDraft["education"]) => void;
  errors: FieldErrors;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 text-xl font-semibold">Education</legend>
      <div className="space-y-2">
        <Label htmlFor="education-level">Highest education level</Label>
        <Select
          id="education-level"
          data-field="education.level"
          value={value.level}
          onChange={(event) =>
            onChange({
              ...value,
              level: event.target.value as EducationLevel | "",
            })
          }
          aria-invalid={Boolean(errors["education.level"])}
          aria-describedby="education-level-help"
        >
          <option value="">Not specified</option>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {EDUCATION_LABELS[level]}
            </option>
          ))}
        </Select>
        <FieldFeedback
          id="education-level-help"
          error={errors["education.level"]}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="education-field">Field of study (optional)</Label>
        <TextInput
          id="education-field"
          data-field="education.field_of_study"
          value={value.fieldOfStudy}
          onChange={(event) =>
            onChange({ ...value, fieldOfStudy: event.target.value })
          }
          aria-invalid={Boolean(errors["education.field_of_study"])}
          aria-describedby="education-field-help"
        />
        <FieldFeedback
          id="education-field-help"
          error={errors["education.field_of_study"]}
          hint="Up to 120 characters. Leave blank if unspecified."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="education-enrolment">Currently enrolled?</Label>
        <Select
          id="education-enrolment"
          data-field="education.is_enrolled"
          value={value.isEnrolled}
          onChange={(event) =>
            onChange({
              ...value,
              isEnrolled: event.target.value as EnrolmentDraft,
            })
          }
          aria-invalid={Boolean(errors["education.is_enrolled"])}
          aria-describedby="education-enrolment-help"
        >
          <option value="">Not specified</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </Select>
        <FieldFeedback
          id="education-enrolment-help"
          error={errors["education.is_enrolled"]}
          hint="Not specified is different from No."
        />
      </div>
    </fieldset>
  );
}
