import { COUNTRY_CODES, LANGUAGE_CODES } from "../contracts/codes.ts";
import type {
  CriterionKey,
  CriterionStatus,
  EducationLevel,
  ExperienceLevel,
  LanguageLevel,
  MatchLabel,
  OpportunityType,
  Severity,
  WorkAuthorisationStatus,
  WorkMode,
} from "../contracts/enums.ts";

export const EDUCATION_LABELS = {
  high_school: "High school",
  diploma: "Diploma",
  bachelor: "Bachelor’s degree",
  master: "Master’s degree",
  doctorate: "Doctorate",
} satisfies Record<EducationLevel, string>;

export const LANGUAGE_LEVEL_LABELS = {
  basic: "Basic",
  conversational: "Conversational",
  professional: "Professional",
  native: "Native",
} satisfies Record<LanguageLevel, string>;

export const WORK_AUTHORISATION_LABELS = {
  unknown: "Not declared",
  citizen: "Citizen",
  permanent_resident: "Permanent resident",
  work_permit: "Work permit",
  student_visa: "Student visa",
  requires_sponsorship: "Requires sponsorship",
  not_authorised: "Not authorised",
} satisfies Record<WorkAuthorisationStatus, string>;

export const WORK_AUTHORISATION_NOTICE = "Self-declared — requires verification";

export const OPPORTUNITY_TYPE_LABELS = {
  job: "Job",
  internship: "Internship",
} satisfies Record<OpportunityType, string>;

export const WORK_MODE_LABELS = {
  onsite: "Onsite",
  hybrid: "Hybrid",
  remote: "Remote",
} satisfies Record<WorkMode, string>;

export const EXPERIENCE_LEVEL_LABELS = {
  internship: "Internship",
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior level",
} satisfies Record<ExperienceLevel, string>;

export const MATCH_LABEL_TEXT = {
  strong: "Strong match",
  partial: "Partial match",
  weak: "Weak match",
  not_recommended: "Not recommended",
  insufficient_data: "Insufficient data",
} satisfies Record<MatchLabel, string>;

export const CRITERION_LABELS = {
  skills: "Skills",
  language: "Language",
  experience: "Experience",
  education: "Education",
  location: "Location",
} satisfies Record<CriterionKey, string>;

export const CRITERION_STATUS_LABELS = {
  met: "Met",
  partial: "Partially met",
  unmet: "Not met",
  unknown: "Not enough information",
} satisfies Record<CriterionStatus, string>;

export const SEVERITY_LABELS = {
  critical: "Critical eligibility gap",
  verify: "Requires verification",
  info: "Information",
} satisfies Record<Severity, string>;

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
const countryCodes = new Set(COUNTRY_CODES);
const languageCodes = new Set(LANGUAGE_CODES);

export function countryLabel(code: string | null): string {
  if (code === null) return "Global remote";
  return countryCodes.has(code)
    ? (countryNames.of(code) ?? code)
    : code;
}

export function languageLabel(code: string): string {
  return languageCodes.has(code)
    ? (languageNames.of(code) ?? code)
    : code;
}

export function keyLabel(key: string): string {
  return key.replaceAll("_", " ");
}
