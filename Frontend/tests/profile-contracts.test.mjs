import assert from "node:assert/strict";
import test from "node:test";
import {
  createProfileWriteSchema,
  profileReadSchema,
} from "../lib/contracts/profile.ts";
import { clerkDisplayName } from "../lib/display/identity.ts";
import {
  createLanguageDraft,
  createProfileDraft,
  parseProfileDraft,
} from "../lib/forms/profile-draft.ts";
import { profileFixture } from "./fixtures/contracts.mjs";

const now = new Date("2026-11-19T00:00:00.000Z");
const writeSchema = createProfileWriteSchema("2026-11-19");

test("minimal profile normalizes omitted data without inventing answers", () => {
  const profile = writeSchema.parse({ full_name: " Fictional Candidate " });
  assert.equal(profile.full_name, "Fictional Candidate");
  assert.equal(profile.experience_years, null);
  assert.deepEqual(profile.education, {
    level: null,
    field_of_study: null,
    is_enrolled: null,
  });
  assert.deepEqual(profile.skills, []);
  assert.deepEqual(profile.work_authorisation, { status: "unknown", countries: [] });
});

test("read model cannot be submitted as a write, including nested extras", () => {
  const profile = profileReadSchema.parse(profileFixture());
  assert.equal(writeSchema.safeParse(profile).success, false);
  assert.equal(
    writeSchema.safeParse({
      full_name: "Fictional Candidate",
      education: { university: "Unsupported fixture field" },
    }).success,
    false,
  );
});

test("omitted nested collections are fresh for each validation", () => {
  const first = writeSchema.parse({ full_name: "First Fixture" });
  first.work_authorisation.countries.push("DE");
  first.skills.push("excel");
  const second = writeSchema.parse({ full_name: "Second Fixture" });
  assert.deepEqual(second.work_authorisation.countries, []);
  assert.deepEqual(second.skills, []);
});

test("null, zero and false remain distinct throughout draft conversion", () => {
  const draft = createProfileDraft(null);
  const unknown = parseProfileDraft(draft, "Fictional Candidate", now);
  assert.equal(unknown.success, true);
  assert.equal(unknown.data.experience_years, null);
  assert.equal(unknown.data.education.is_enrolled, null);

  draft.experienceYears = "0";
  draft.education.isEnrolled = "no";
  const explicit = parseProfileDraft(draft, "Fictional Candidate", now);
  assert.equal(explicit.success, true);
  assert.equal(explicit.data.experience_years, 0);
  assert.equal(explicit.data.education.is_enrolled, false);
});

test("numeric drafts reject fractions, signs, exponents and out-of-range values", () => {
  for (const value of ["2.5", "-1", "1e1", "+2", "NaN", "61"]) {
    const draft = { ...createProfileDraft(null), experienceYears: value };
    const result = parseProfileDraft(draft, "Fictional Candidate", now);
    assert.equal(result.success, false, value);
    assert.ok(result.fields.experience_years, value);
  }
});

test("canonical aliases normalize and deduplicate before limits", () => {
  const profile = writeSchema.parse({
    full_name: "Fictional Candidate",
    skills: ["MS Excel", "microsoft-excel", "Ｐｙｔｈｏｎ", "ML"],
    preferred_locations: ["Germany", "DE", "ca"],
    career_interests: ["Programme Support", "programme_support"],
    languages: [{ language: "Bangla", level: "native" }],
  });
  assert.deepEqual(profile.skills, ["excel", "python", "machine_learning"]);
  assert.deepEqual(profile.preferred_locations, ["DE", "CA"]);
  assert.deepEqual(profile.career_interests, ["programme_support"]);
  assert.equal(profile.languages[0].language, "bn");
  assert.equal(
    writeSchema.safeParse({
      full_name: "Fictional Candidate",
      skills: Array(31).fill("excel"),
    }).success,
    true,
  );
});

test("arrays cannot be replaced by null and language aliases cannot duplicate rows", () => {
  for (const key of [
    "skills",
    "languages",
    "preferred_locations",
    "career_interests",
  ]) {
    assert.equal(
      writeSchema.safeParse({ full_name: "Fixture", [key]: null }).success,
      false,
    );
  }
  const draft = createProfileDraft(null);
  draft.languages = [
    { id: "row-a", language: "English", level: "basic" },
    { id: "row-b", language: "en", level: "professional" },
  ];
  const result = parseProfileDraft(draft, "Fixture", now);
  assert.equal(result.success, false);
  assert.ok(result.fields["languages.1.language"]);
});

test("work authorisation keeps uncertainty separate from location preferences", () => {
  const draft = createProfileDraft(null);
  draft.preferredLocations = ["DE"];
  const unknown = parseProfileDraft(draft, "Fixture", now);
  assert.equal(unknown.success, true);
  assert.deepEqual(unknown.data.work_authorisation, {
    status: "unknown",
    countries: [],
  });

  draft.workAuthorisation = { status: "citizen", countries: [] };
  const missingCountries = parseProfileDraft(draft, "Fixture", now);
  assert.equal(missingCountries.success, false);
  assert.ok(missingCountries.fields["work_authorisation.countries"]);

  draft.workAuthorisation = { status: "unknown", countries: ["DE"] };
  assert.equal(parseProfileDraft(draft, "Fixture", now).success, false);
  draft.workAuthorisation = { status: "citizen", countries: ["Germany"] };
  assert.equal(parseProfileDraft(draft, "Fixture", now).success, true);
});

test("birthdays are real bounded dates without timestamps or timezone conversion", () => {
  for (const value of [
    "2026-11-20",
    "1899-12-31",
    "2025-02-29",
    "2026-02-30",
    "1998-04-12T00:00:00Z",
  ]) {
    assert.equal(
      writeSchema.safeParse({ full_name: "Fixture", birthday: value }).success,
      false,
    );
  }
  for (const value of [null, "1900-01-01", "2024-02-29", "2026-11-19"]) {
    assert.equal(
      writeSchema.parse({ full_name: "Fixture", birthday: value }).birthday,
      value,
    );
  }
});

test("drafts copy collections, keep stable row IDs and submit current Clerk name only", () => {
  const profile = profileFixture({
    languages: [{ language: "en", level: "professional" }],
    preferred_locations: ["DE"],
  });
  const first = createProfileDraft(profile);
  const second = createProfileDraft(profile);
  assert.equal(first.languages[0].id, second.languages[0].id);
  first.preferredLocations.push("CA");
  assert.deepEqual(profile.preferred_locations, ["DE"]);
  assert.deepEqual(createLanguageDraft("new-row"), {
    id: "new-row",
    language: "",
    level: "",
  });

  const result = parseProfileDraft(first, "Current Fictional Clerk Name", now);
  assert.equal(result.success, true);
  assert.equal(result.data.full_name, "Current Fictional Clerk Name");
  for (const key of ["user_id", "created_at", "updated_at"]) {
    assert.equal(Object.hasOwn(result.data, key), false);
  }
  assert.equal(Object.hasOwn(result.data.languages[0], "id"), false);
});

test("display identity uses the documented fallback order", () => {
  assert.equal(
    clerkDisplayName({ fullName: " Full Name ", firstName: "Other" }),
    "Full Name",
  );
  assert.equal(
    clerkDisplayName({ firstName: "Fictional", lastName: "Candidate" }),
    "Fictional Candidate",
  );
  assert.equal(
    clerkDisplayName({
      primaryEmailAddress: { emailAddress: "fixture@example.invalid" },
    }),
    "fixture",
  );
  assert.equal(clerkDisplayName({}), "User");
});
