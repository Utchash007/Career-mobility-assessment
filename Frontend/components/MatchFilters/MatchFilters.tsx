"use client";

import { Label, Select } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import CollectionFilters from "@/components/CollectionFilters/CollectionFilters";
import { MATCH_LABELS, type MatchLabel } from "@/lib/contracts/enums.ts";
import { MATCH_LABEL_TEXT } from "@/lib/display/labels.ts";
import { type FieldErrors, validationFieldErrors } from "@/lib/forms/errors.ts";
import {
  applyMatchFilters,
  type MatchQuery,
} from "@/lib/queries/collections.ts";

export default function MatchFilters({ query }: { query: MatchQuery }) {
  const router = useRouter();
  const [label, setLabel] = useState<MatchLabel | "">(query.label ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  return (
    <CollectionFilters
      query={query}
      errors={errors}
      onApply={(draft) => {
        try {
          router.push(
            `/recommendations?${applyMatchFilters({ ...draft, label })}`,
          );
          setErrors({});
        } catch (error) {
          setErrors(
            error instanceof z.ZodError
              ? validationFieldErrors(error)
              : { body: "Review the filters." },
          );
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="filter-label">Match label</Label>
        <Select
          id="filter-label"
          value={label}
          onChange={(event) => setLabel(event.target.value as MatchLabel | "")}
        >
          <option value="">All match labels</option>
          {MATCH_LABELS.map((value) => (
            <option key={value} value={value}>
              {MATCH_LABEL_TEXT[value]}
            </option>
          ))}
        </Select>
      </div>
    </CollectionFilters>
  );
}
