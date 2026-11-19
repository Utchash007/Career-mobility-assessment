"use client";

import { Label, Select } from "flowbite-react";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import { COUNTRY_CODES } from "@/lib/contracts/codes.ts";
import { countryLabel } from "@/lib/display/labels.ts";

export default function CountryChoices({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  field,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
  field: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        data-field={field}
        multiple
        size={6}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-help`}
        onChange={(event) =>
          onChange(
            Array.from(event.target.selectedOptions, (option) => option.value),
          )
        }
      >
        {COUNTRY_CODES.map((code) => (
          <option key={code} value={code}>
            {countryLabel(code)} ({code})
          </option>
        ))}
      </Select>
      <FieldFeedback
        id={`${id}-help`}
        error={error}
        hint="Select multiple countries with Ctrl/Command on desktop, or your device’s selection controls. No preference implies legal eligibility."
      />
    </div>
  );
}
