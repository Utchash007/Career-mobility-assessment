import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

export function loadRootEnv(
  envFile = fileURLToPath(new URL("../.env", import.meta.url)),
) {
  // Next.js loads Frontend/.env* before evaluating next.config.ts. Node's
  // loader fills only missing keys, preserving project and process overrides.
  try {
    loadEnvFile(envFile);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}
