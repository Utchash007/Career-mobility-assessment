import { z } from "zod";
import {
  canonicalKeySchema,
  countryCodeSchema,
  languageCodeSchema,
  skillKeySchema,
  uniqueArraySchema,
} from "../forms/normalise.ts";
import { textSchema, timestampSchema } from "./common.ts";
import {
  EDUCATION_LEVELS,
  type EducationLevel,
  LANGUAGE_LEVELS,
  type LanguageLevel,
  WORK_AUTHORISATION_STATUSES,
  type WorkAuthorisationStatus,
} from "./enums.ts";

export interface Education {
  level: EducationLevel | null;
  field_of_study: string | null;
  is_enrolled: boolean | null;
}

export interface ProfileLanguage {
  language: string;
  level: LanguageLevel;
}

export interface WorkAuthorisation {
  status: WorkAuthorisationStatus;
  countries: string[];
}

// Complete normalized write snapshot. No response-only fields are included.
export interface ProfileWrite {
  full_name: string;
  birthday: string | null;
  education: Education;
  experience_years: number | null;
  skills: string[];
  languages: ProfileLanguage[];
  preferred_locations: string[];
  career_interests: string[];
  work_authorisation: WorkAuthorisation;
}

export interface ProfileRead extends ProfileWrite {
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function utcToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a real calendar date.");

function birthdaySchema(today: () => string) {
  return dateOnlySchema.refine(
    (value) => value >= "1900-01-01" && value <= today(),
    "Birthday must be between 1900-01-01 and today (UTC).",
  );
}

export const educationSchema = z.strictObject({
  level: z.enum(EDUCATION_LEVELS).nullable().default(null),
  field_of_study: textSchema(120).nullable().default(null),
  is_enrolled: z.boolean().nullable().default(null),
}) satisfies z.ZodType<Education>;

export const profileLanguageSchema = z.strictObject({
  language: languageCodeSchema,
  level: z.enum(LANGUAGE_LEVELS),
}) satisfies z.ZodType<ProfileLanguage>;

export const workAuthorisationSchema = z
  .strictObject({
    status: z.enum(WORK_AUTHORISATION_STATUSES).default("unknown"),
    countries: uniqueArraySchema(countryCodeSchema).default([]),
  })
  .superRefine((value, context) => {
    if ((value.status === "unknown") !== (value.countries.length === 0)) {
      context.addIssue({
        code: "custom",
        path: ["countries"],
        message:
          "Unknown status needs no countries; a declared status needs at least one country.",
      });
    }
  }) satisfies z.ZodType<WorkAuthorisation>;

const profileLanguagesSchema = z
  .array(profileLanguageSchema)
  .max(10)
  .superRefine((items, context) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (seen.has(item.language)) {
        context.addIssue({
          code: "custom",
          path: [index, "language"],
          message: "Declare each language only once.",
        });
      }
      seen.add(item.language);
    });
  });

function profileShape(today: () => string) {
  return {
    full_name: textSchema(200),
    birthday: birthdaySchema(today).nullable().default(null),
    education: educationSchema.default({
      level: null,
      field_of_study: null,
      is_enrolled: null,
    }),
    experience_years: z.number().int().min(0).max(60).nullable().default(null),
    skills: uniqueArraySchema(skillKeySchema, 30).default([]),
    languages: profileLanguagesSchema.default([]),
    preferred_locations: uniqueArraySchema(countryCodeSchema, 10).default([]),
    career_interests: uniqueArraySchema(canonicalKeySchema, 15).default([]),
    work_authorisation: workAuthorisationSchema.default(() => ({
      status: "unknown",
      countries: [],
    })),
  };
}

export function createProfileWriteSchema(today: string) {
  dateOnlySchema.parse(today);
  return z.strictObject(profileShape(() => today));
}

// UTC today is evaluated during validation, not frozen at module/server startup.
export const profileWriteSchema = z.strictObject(
  profileShape(() => utcToday()),
) satisfies z.ZodType<ProfileWrite>;

export const profileReadSchema = z.strictObject({
  ...profileShape(() => utcToday()),
  user_id: z.string().min(1),
  created_at: timestampSchema,
  updated_at: timestampSchema,
}) satisfies z.ZodType<ProfileRead>;
