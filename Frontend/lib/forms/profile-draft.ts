import type {
  EducationLevel,
  LanguageLevel,
  WorkAuthorisationStatus,
} from "../contracts/enums.ts";
import {
  createProfileWriteSchema,
  type ProfileRead,
  type ProfileWrite,
  utcToday,
} from "../contracts/profile.ts";
import { type FieldErrors, validationFieldErrors } from "./errors.ts";
import { splitKeyInput } from "./normalise.ts";

export type EnrolmentDraft = "" | "yes" | "no";

export interface LanguageDraft {
  id: string;
  language: string;
  level: LanguageLevel | "";
}

export interface ProfileDraft {
  birthday: string;
  education: {
    level: EducationLevel | "";
    fieldOfStudy: string;
    isEnrolled: EnrolmentDraft;
  };
  experienceYears: string;
  skillsText: string;
  languages: LanguageDraft[];
  preferredLocations: string[];
  careerInterestsText: string;
  workAuthorisation: {
    status: WorkAuthorisationStatus;
    countries: string[];
  };
}

export type ProfileDraftResult =
  | { success: true; data: ProfileWrite }
  | { success: false; fields: FieldErrors };

export function createLanguageDraft(id: string): LanguageDraft {
  // The client supplies a fresh stable ID in its Add event; no global counters.
  return { id, language: "", level: "" };
}

export function createProfileDraft(profile: ProfileRead | null): ProfileDraft {
  return {
    birthday: profile?.birthday ?? "",
    education: {
      level: profile?.education.level ?? "",
      fieldOfStudy: profile?.education.field_of_study ?? "",
      isEnrolled:
        profile?.education.is_enrolled == null
          ? ""
          : profile.education.is_enrolled
            ? "yes"
            : "no",
    },
    experienceYears:
      profile?.experience_years == null ? "" : String(profile.experience_years),
    skillsText: profile?.skills.join(", ") ?? "",
    languages:
      profile?.languages.map((item) => ({
        id: `saved-language-${item.language}`,
        language: item.language,
        level: item.level,
      })) ?? [],
    preferredLocations: [...(profile?.preferred_locations ?? [])],
    careerInterestsText: profile?.career_interests.join(", ") ?? "",
    workAuthorisation: {
      status: profile?.work_authorisation.status ?? "unknown",
      countries: [...(profile?.work_authorisation.countries ?? [])],
    },
  };
}

function experienceValue(value: string): number | string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Do not use Number("") or parseInt("2.5"); neither is an honest answer.
  return /^[0-9]+$/.test(trimmed) ? Number(trimmed) : trimmed;
}

function enrolmentValue(value: EnrolmentDraft): boolean | null | string {
  if (value === "yes") return true;
  if (value === "no") return false;
  return value === "" ? null : value;
}

export function parseProfileDraft(
  draft: ProfileDraft,
  clerkDisplayName: string,
  now: Date = new Date(),
): ProfileDraftResult {
  // Explicit allowlist. Never spread ProfileRead or include draft-only row IDs.
  const result = createProfileWriteSchema(utcToday(now)).safeParse({
    full_name: clerkDisplayName,
    birthday: draft.birthday.trim() || null,
    education: {
      level: draft.education.level || null,
      field_of_study: draft.education.fieldOfStudy.trim() || null,
      is_enrolled: enrolmentValue(draft.education.isEnrolled),
    },
    experience_years: experienceValue(draft.experienceYears),
    skills: splitKeyInput(draft.skillsText),
    languages: draft.languages.map(({ language, level }) => ({ language, level })),
    preferred_locations: draft.preferredLocations,
    career_interests: splitKeyInput(draft.careerInterestsText),
    work_authorisation: {
      status: draft.workAuthorisation.status,
      // Invalid status/country combinations must fail, not silently erase input.
      countries: draft.workAuthorisation.countries,
    },
  });
  return result.success
    ? { success: true, data: result.data }
    : { success: false, fields: validationFieldErrors(result.error) };
}
