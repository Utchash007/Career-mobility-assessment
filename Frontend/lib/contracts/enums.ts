// Manually maintained against Backend/app/schemas/enums.py; not scoring rules.
export const EDUCATION_LEVELS = [
  "high_school",
  "diploma",
  "bachelor",
  "master",
  "doctorate",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const LANGUAGE_LEVELS = [
  "basic",
  "conversational",
  "professional",
  "native",
] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export const WORK_AUTHORISATION_STATUSES = [
  "unknown",
  "citizen",
  "permanent_resident",
  "work_permit",
  "student_visa",
  "requires_sponsorship",
  "not_authorised",
] as const;
export type WorkAuthorisationStatus =
  (typeof WORK_AUTHORISATION_STATUSES)[number];

export const OPPORTUNITY_TYPES = ["job", "internship"] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const WORK_MODES = ["onsite", "hybrid", "remote"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EXPERIENCE_LEVELS = [
  "internship",
  "entry",
  "mid",
  "senior",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const SEVERITIES = ["critical", "verify", "info"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const CRITERION_KEYS = [
  "skills",
  "language",
  "experience",
  "education",
  "location",
] as const;
export type CriterionKey = (typeof CRITERION_KEYS)[number];

export const CRITERION_STATUSES = ["met", "partial", "unmet", "unknown"] as const;
export type CriterionStatus = (typeof CRITERION_STATUSES)[number];

export const MATCH_LABELS = [
  "strong",
  "partial",
  "weak",
  "not_recommended",
  "insufficient_data",
] as const;
export type MatchLabel = (typeof MATCH_LABELS)[number];

export const EDUCATION_FIELD_GROUPS = [
  "business",
  "social_science",
  "computer_science",
  "engineering",
  "data_science",
  "finance",
  "economics",
  "humanities",
  "other",
] as const;
export type EducationFieldGroup = (typeof EDUCATION_FIELD_GROUPS)[number];
