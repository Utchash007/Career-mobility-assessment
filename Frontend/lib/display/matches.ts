import { z } from "zod";
import {
  EDUCATION_LEVELS,
  LANGUAGE_LEVELS,
  WORK_MODES,
} from "../contracts/enums.ts";
import type { CriterionResult, MatchResult } from "../contracts/match.ts";
import {
  exactCountryCodeSchema,
  exactLanguageCodeSchema,
  storedKeySchema,
} from "../forms/normalise.ts";
import {
  countryLabel,
  EDUCATION_LABELS,
  keyLabel,
  LANGUAGE_LEVEL_LABELS,
  languageLabel,
  WORK_MODE_LABELS,
} from "./labels.ts";

export function scoreText(score: number | null): string {
  return score === null ? "Insufficient data" : `${score.toFixed(1)} / 100`;
}

const keys = z.array(storedKeySchema).max(30);
const skills = z.object({
  matched: keys,
  missing: keys,
  preferred_matched: keys,
  preferred_missing: keys,
  required_count: z.number().int().min(0).max(30),
});
const experience = z.object({
  actual_years: z.number().min(0).max(60).nullable(),
  min_years: z.number().min(0).max(60),
  max_years: z.number().min(0).max(60).nullable(),
});
const education = z.object({
  actual_level: z.enum(EDUCATION_LEVELS).nullable(),
  required_level: z.enum(EDUCATION_LEVELS).nullable(),
  actual_field_group: z.string().max(120).nullable(),
  related_fields: z.array(z.string().max(120)).max(30),
});
const language = z.object({
  requirements: z
    .array(
      z.object({
        language: exactLanguageCodeSchema,
        actual_level: z.enum(LANGUAGE_LEVELS).nullable(),
        required_level: z.enum(LANGUAGE_LEVELS),
        required: z.boolean(),
      }),
    )
    .max(5),
});
const location = z.object({
  country: exactCountryCodeSchema.nullable(),
  preferred_locations: z.array(exactCountryCodeSchema).max(10),
  work_mode: z.enum(WORK_MODES),
});

export interface EvidenceLine {
  label: string;
  value: string;
}

// Each criterion has its own schema. Unknown/nested arbitrary data is never dumped.
export function criterionEvidence(criterion: CriterionResult): EvidenceLine[] {
  if (criterion.key === "skills") {
    const result = skills.safeParse(criterion.evidence);
    if (!result.success) return [];
    return [
      {
        label: "Required skills matched",
        value: result.data.matched.map(keyLabel).join(", ") || "None",
      },
      {
        label: "Required skills missing",
        value: result.data.missing.map(keyLabel).join(", ") || "None",
      },
      {
        label: "Preferred skills matched",
        value: result.data.preferred_matched.map(keyLabel).join(", ") || "None",
      },
      {
        label: "Preferred skills not declared (informational)",
        value: result.data.preferred_missing.map(keyLabel).join(", ") || "None",
      },
    ];
  }
  if (criterion.key === "experience") {
    const result = experience.safeParse(criterion.evidence);
    if (!result.success) return [];
    return [
      {
        label: "Declared years",
        value:
          result.data.actual_years === null
            ? "Not declared"
            : String(result.data.actual_years),
      },
      {
        label: "Opportunity range",
        value:
          result.data.max_years === null
            ? `${result.data.min_years}+; no maximum specified`
            : `${result.data.min_years}–${result.data.max_years}`,
      },
    ];
  }
  if (criterion.key === "education") {
    const result = education.safeParse(criterion.evidence);
    if (!result.success) return [];
    return [
      {
        label: "Declared level",
        value:
          result.data.actual_level === null
            ? "Not declared"
            : EDUCATION_LABELS[result.data.actual_level],
      },
      {
        label: "Required level",
        value:
          result.data.required_level === null
            ? "No minimum specified"
            : EDUCATION_LABELS[result.data.required_level],
      },
      {
        label: "Declared field group",
        value: result.data.actual_field_group
          ? keyLabel(result.data.actual_field_group)
          : "Not declared or unrecognized",
      },
      {
        label: "Related fields",
        value:
          result.data.related_fields.map(keyLabel).join(", ") || "Any field",
      },
    ];
  }
  if (criterion.key === "language") {
    const result = language.safeParse(criterion.evidence);
    if (!result.success) return [];
    return result.data.requirements.map((item) => ({
      label: `${languageLabel(item.language)} · ${item.required ? "required" : "preferred"}`,
      value: `Declared: ${item.actual_level === null ? "not declared" : LANGUAGE_LEVEL_LABELS[item.actual_level]}; minimum: ${LANGUAGE_LEVEL_LABELS[item.required_level]}`,
    }));
  }
  const result = location.safeParse(criterion.evidence);
  if (!result.success) return [];
  return [
    { label: "Hiring location", value: countryLabel(result.data.country) },
    {
      label: "Preferred locations",
      value:
        result.data.preferred_locations.map(countryLabel).join(", ") ||
        "Not declared",
    },
    { label: "Work mode", value: WORK_MODE_LABELS[result.data.work_mode] },
  ];
}

export function matchReasons(match: MatchResult) {
  return {
    strengths: match.criteria.filter((criterion) => criterion.status === "met"),
    gaps: match.criteria.filter(
      (criterion) =>
        criterion.status === "partial" || criterion.status === "unmet",
    ),
    unknown: match.criteria.filter(
      (criterion) => criterion.status === "unknown",
    ),
  };
}
