import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadRootEnv } from "../load-root-env.mjs";

test("root env fills missing values and preserves existing values", () => {
  const directory = mkdtempSync(join(tmpdir(), "career-mobility-env-"));
  const path = join(directory, ".env");
  const fallbackKey = "CAREER_MOBILITY_TEST_ROOT_FALLBACK";
  const overrideKey = "CAREER_MOBILITY_TEST_ENV_OVERRIDE";
  const previousFallback = process.env[fallbackKey];
  const previousOverride = process.env[overrideKey];
  try {
    delete process.env[fallbackKey];
    process.env[overrideKey] = "project-or-process";
    writeFileSync(path, `${fallbackKey}=root\n${overrideKey}=root\n`);
    loadRootEnv(path);
    assert.equal(process.env[fallbackKey], "root");
    assert.equal(process.env[overrideKey], "project-or-process");
  } finally {
    for (const [key, previous] of [
      [fallbackKey, previousFallback],
      [overrideKey, previousOverride],
    ]) {
      if (previous === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous;
      }
    }
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a missing root env is optional", () => {
  const directory = mkdtempSync(join(tmpdir(), "career-mobility-env-"));
  try {
    assert.doesNotThrow(() => loadRootEnv(join(directory, ".env")));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("non-missing file errors are not swallowed", () => {
  assert.throws(() => loadRootEnv(42), { code: "ERR_INVALID_ARG_TYPE" });
});
