import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const component = (name) => readFileSync(new URL(`../components/${name}/${name}.tsx`, import.meta.url), "utf8");

test("profile leaves are controlled and never perform persistence", () => {
  for (const name of ["ProfileIdentityFields", "EducationFields", "ExperienceFields", "SkillsFields", "LanguageRow", "LanguageFields", "PreferenceFields", "WorkAuthorisationFields"]) {
    assert.doesNotMatch(component(name), /useState|useEffect|useApi\(|fetch\(|localStorage|sessionStorage/);
  }
});

test("profile keeps a single draft, validates before writing and retains failed inputs", () => {
  const source = component("ProfileForm");
  assert.match(source, /parseProfileDraft\(draft, displayName\)/);
  assert.match(source, /api\.saveProfile\(parsed\.data\)/);
  assert.match(source, /focusInvalidField/);
  assert.doesNotMatch(source, /useEffect|localStorage|sessionStorage/);
  assert.match(source, /failure\?\.unconfirmed/);
  assert.match(source, /setDraft\(createProfileDraft\(profile\)\)/);
});

test("language rows use stable IDs and creation happens only in the Add event", () => {
  assert.match(component("LanguageFields"), /key=\{row\.id\}/);
  assert.match(component("LanguageFields"), /crypto\.randomUUID\(\)/);
  assert.match(component("LanguageFields"), /value\.length >= 10/);
});

test("sample replacement explicitly confirms existing and unsaved data", () => {
  const source = component("SampleProfileAction");
  assert.match(source, /ConfirmationDialog/);
  assert.match(source, /existing profile and unsaved edits/);
  assert.doesNotMatch(source, /api\.|useEffect/);
});
