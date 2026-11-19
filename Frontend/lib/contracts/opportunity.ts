import { z } from "zod";
import {
  exactCountryCodeSchema,
  exactLanguageCodeSchema,
  storedKeySchema,
} from "../forms/normalise.ts";
import {
  emptyObjectSchema,
  paginatedSchema,
  positiveIdSchema,
  textSchema,
  timestampSchema,
} from "./common.ts";
import {
  EDUCATION_FIELD_GROUPS,
  EDUCATION_LEVELS,
  type EducationFieldGroup,
  type EducationLevel,
  EXPERIENCE_LEVELS,
  type ExperienceLevel,
  LANGUAGE_LEVELS,
  type LanguageLevel,
  OPPORTUNITY_TYPES,
  type OpportunityType,
  SEVERITIES,
  type Severity,
  WORK_MODES,
  type WorkMode,
} from "./enums.ts";

export interface EducationRequirement {
  min_level: EducationLevel;
  related_fields: EducationFieldGroup[];
}

export interface EducationRequirements {
  required: EducationRequirement | null;
  preferred: EducationRequirement | null;
}

export interface OpportunityLanguage {
  language: string;
  min_level: LanguageLevel;
  required: boolean;
}

interface RequirementBase {
  label: string;
  severity: Severity;
}

export type EligibilityRequirement = RequirementBase &
  (
    | {
        code: "work_authorisation";
        params: { country: string | null; sponsorship: boolean | null };
      }
    | { code: "enrolment"; params: Record<string, never> }
    | { code: "licence"; params: { licence_type: string } }
    | { code: "other"; params: Record<string, never> }
  );

export interface OpportunitySummary {
  id: number;
  slug: string;
  title: string;
  organisation: string;
  country: string | null;
  city: string | null;
  type: OpportunityType;
  experience_level: ExperienceLevel;
  min_years: number;
  max_years: number | null;
  required_skills: string[];
  preferred_skills: string[];
  education_requirements: EducationRequirements;
  languages: OpportunityLanguage[];
  eligibility_requirements: EligibilityRequirement[];
  work_mode: WorkMode;
  is_shortlisted: boolean;
}

export interface OpportunityRead extends OpportunitySummary {
  description: string;
  created_at: string;
  updated_at: string;
}

export const educationRequirementSchema = z.strictObject({
  min_level: z.enum(EDUCATION_LEVELS),
  related_fields: z.array(z.enum(EDUCATION_FIELD_GROUPS)).default([]),
}) satisfies z.ZodType<EducationRequirement>;

const requirementBase = {
  label: textSchema(200),
  severity: z.enum(SEVERITIES),
};

export const eligibilityRequirementSchema = z.discriminatedUnion("code", [
  z.strictObject({
    ...requirementBase,
    code: z.literal("work_authorisation"),
    params: z.strictObject({
      country: exactCountryCodeSchema.nullable().default(null),
      sponsorship: z.boolean().nullable().default(null),
    }),
  }),
  z.strictObject({
    ...requirementBase,
    code: z.literal("enrolment"),
    params: emptyObjectSchema,
  }),
  z.strictObject({
    ...requirementBase,
    code: z.literal("licence"),
    params: z.strictObject({ licence_type: textSchema() }),
  }),
  z.strictObject({
    ...requirementBase,
    code: z.literal("other"),
    params: emptyObjectSchema,
  }),
]) satisfies z.ZodType<EligibilityRequirement>;

const opportunityShape = {
  id: positiveIdSchema,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: textSchema(),
  organisation: textSchema(),
  country: exactCountryCodeSchema.nullable(),
  city: textSchema().nullable(),
  type: z.enum(OPPORTUNITY_TYPES),
  experience_level: z.enum(EXPERIENCE_LEVELS),
  min_years: z.number().int().min(0).max(60),
  max_years: z.number().int().min(0).max(60).nullable(),
  required_skills: z.array(storedKeySchema).max(30),
  preferred_skills: z.array(storedKeySchema).max(30),
  education_requirements: z.strictObject({
    required: educationRequirementSchema.nullable().default(null),
    preferred: educationRequirementSchema.nullable().default(null),
  }),
  languages: z
    .array(
      z.strictObject({
        language: exactLanguageCodeSchema,
        min_level: z.enum(LANGUAGE_LEVELS),
        required: z.boolean(),
      }),
    )
    .max(5),
  eligibility_requirements: z.array(eligibilityRequirementSchema).max(10),
  work_mode: z.enum(WORK_MODES),
  is_shortlisted: z.boolean(),
};

function consistentOpportunity(
  value: OpportunitySummary,
  context: z.RefinementCtx,
) {
  if (value.max_years !== null && value.max_years < value.min_years) {
    context.addIssue({
      code: "custom",
      path: ["max_years"],
      message: "Maximum experience cannot be below minimum experience.",
    });
  }
  if (value.country === null && value.work_mode !== "remote") {
    context.addIssue({
      code: "custom",
      path: ["country"],
      message: "Only a global remote opportunity may omit its country.",
    });
  }
  if (value.work_mode === "onsite" && !value.city) {
    context.addIssue({
      code: "custom",
      path: ["city"],
      message: "Onsite opportunities require a city.",
    });
  }
  if (
    new Set(value.languages.map((item) => item.language)).size !==
    value.languages.length
  ) {
    context.addIssue({
      code: "custom",
      path: ["languages"],
      message: "Opportunity languages must be unique.",
    });
  }
}

export const opportunitySummarySchema = z
  .strictObject(opportunityShape)
  .superRefine(consistentOpportunity) satisfies z.ZodType<OpportunitySummary>;

export const opportunityReadSchema = z
  .strictObject({
    ...opportunityShape,
    description: z.string(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .superRefine(consistentOpportunity) satisfies z.ZodType<OpportunityRead>;

export const opportunityPageSchema = paginatedSchema(opportunitySummarySchema);
