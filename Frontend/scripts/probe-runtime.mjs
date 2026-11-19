// Loopback HTTP smoke checks only, requiring a credential-free source snapshot.
// No browser, auth adapter, application API requests or mutation calls.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const directory of [
  new URL("../", import.meta.url),
  new URL("../../", import.meta.url),
]) {
  assert.ok(
    !readdirSync(directory).some((name) => name.startsWith(".env")),
    "Run probes only in a snapshot without environment files.",
  );
}
assert.ok(
  !Object.keys(process.env).some((name) =>
    /^(CLERK_|NEXT_PUBLIC_CLERK_|NEXT_PUBLIC_API_URL$|DATABASE_|JWKS_)/.test(
      name,
    ),
  ),
  "Remove application credentials/configuration from the probe process.",
);

const mode = process.argv[2];
assert.ok(["dev", "production"].includes(mode), "Choose dev or production.");
const port = mode === "dev" ? 3210 : 3211;
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    mode === "dev" ? "dev" : "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: root,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Startup timed out.")),
      60_000,
    );
    const ready = () => {
      if (output.includes("Ready in")) {
        clearTimeout(timeout);
        child.stdout.off("data", ready);
        resolve();
      }
    };
    child.stdout.on("data", ready);
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited before probes: ${code}.`));
    });
  });
  const origin = `http://127.0.0.1:${port}`;
  const health = await fetch(`${origin}/api/health`, {
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  const paths = [
    "/",
    "/setup",
    "/sign-in",
    "/sign-up",
    "/profile",
    "/opportunities?page=2",
    "/recommendations",
    "/shortlist",
    "/account",
    "/opportunities/0",
    "/unknown-route",
  ];
  // First page allows dev compilation to finish before the remaining smoke requests.
  for (const path of paths) {
    const response = await fetch(`${origin}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
    assert.equal(
      response.status,
      200,
      `${path} should safely rewrite to setup when Clerk is absent.`,
    );
    const html = await response.text();
    assert.match(html, /Authentication setup is required/);
    assert.doesNotMatch(
      html,
      /Amina Rahman|Fictional Candidate|1998-04-12|user_fictional|Bearer /,
    );
    console.log(`${mode}: ${path} → setup (200)`);
  }
  assert.doesNotMatch(
    output,
    /Error:|TypeError:|ReferenceError:|Cannot find|Functions cannot be passed|Hydration failed/,
  );
  console.log(
    `${mode}: public health and ${paths.length} setup routes passed; no private workflow exercised.`,
  );
} finally {
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill();
  if (child.exitCode === null && child.signalCode === null) await exited;
}
