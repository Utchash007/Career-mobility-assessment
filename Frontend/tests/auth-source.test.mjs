import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CLERK_APPEARANCE,
  CLERK_AUTH_APPEARANCE,
} from "../lib/display/clerk-appearance.ts";
import { CLERK_LOCALIZATION } from "../lib/display/clerk-localization.ts";
import { CONFIGURATION_COPY } from "../lib/display/feedback.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const component = (name) => read(`components/${name}/${name}.tsx`);

test("Clerk provider stays server-side and never serializes a secret", () => {
  const source = component("AppProviders");
  assert.doesNotMatch(source, /^"use client"|secretKey=|CLERK_SECRET_KEY/);
  assert.match(source, /ClerkProvider/);
  assert.match(read("lib/auth/config.ts"), /import "server-only"/);
  assert.match(read("lib/api/server.ts"), /import "server-only"/);
  assert.match(
    read("next.config.ts"),
    /NEXT_PUBLIC_CLERK_KEYLESS_DISABLED = "true"/,
  );
});

test("proxy sets in-app auth URLs without a protection handler; missing config fails closed", () => {
  const source = read("proxy.ts");
  assert.match(
    source,
    /clerkMiddleware\(\{\s*signInUrl: "\/sign-in",\s*signUpUrl: "\/sign-up",\s*\}\)/,
  );
  assert.doesNotMatch(source, /createRouteMatcher|auth\.protect|userId|mock/);
  assert.match(source, /NextResponse\.rewrite\(new URL\("\/setup"/);
  assert.match(source, /pathname === "\/api\/health"/);
});

test("each protected page checks authorization before rendering", () => {
  function check(directory) {
    for (const entry of readdirSync(
      new URL(`../${directory}`, import.meta.url),
      { withFileTypes: true },
    )) {
      if (entry.isDirectory()) check(`${directory}/${entry.name}`);
      else if (entry.name === "page.tsx") {
        const source = read(`${directory}/${entry.name}`);
        assert.match(source, /await auth\.protect\(\)/);
        assert.ok(
          source.indexOf("await auth.protect()") < source.indexOf("return <"),
        );
      }
    }
  }
  check("app/(app)");
});

test("session boundary hides stale server content and remounts client drafts", () => {
  const source = component("SessionBoundary");
  assert.match(source, /session\?\.status === "active"/);
  assert.match(source, /auth\.userId === expectedUserId/);
  assert.match(source, /session\.id === expectedSessionId/);
  assert.match(source, /key=\{`\$\{auth\.userId\}:\$\{session\.id\}`\}/);
  assert.match(component("SessionScope"), /scope\.controller\.abort\(\)/);
  assert.match(component("SessionScope"), /clerk\.session\?\.id === sessionId/);
});

test("auth screens retain real Clerk account forms and their catch-all routes", () => {
  for (const [name, widget] of [
    ["SignInScreen", "SignIn"],
    ["SignUpScreen", "SignUp"],
  ]) {
    assert.match(component(name), new RegExp(`<${widget}\\s+routing="path"`));
    assert.doesNotMatch(component(name), /type="password"|<form|fetch\(/);
    assert.match(component(name), /appearance=\{CLERK_AUTH_APPEARANCE\}/);
    assert.match(component(name), /fallback=\{<LoadingState label=/);
    assert.match(component(name), /<AuthLayout>/);
  }
});

test("auth screens use account-oriented copy rather than developer setup copy", () => {
  assert.equal(
    CLERK_LOCALIZATION.signIn.start.title,
    "Welcome to Career Mobility",
  );
  assert.equal(CLERK_LOCALIZATION.signUp.start.title, "Create your account");
  for (const name of [
    "AuthLayout",
    "SignInScreen",
    "SignUpScreen",
    "SetupScreen",
  ]) {
    assert.doesNotMatch(
      component(name),
      /Clerk manages|securely with Clerk|Career Mobility setup|process\.env|CLERK_SECRET_KEY|publishable key|API key/i,
    );
  }
});

test("unconfigured auth shows a safe retry, not key instructions or a pretend form", () => {
  const source = component("SetupScreen");
  assert.match(source, /<ConfigurationNotice kind="authentication"/);
  // An ordinary anchor reloads the page rather than reusing a stale router cache.
  assert.match(source, /<Button\s+as="a"\s+href="\/sign-in"/);
  assert.doesNotMatch(source, /<SignIn\b|<SignUp\b|<form\b|type="password"/);
  const copy = Object.values(CONFIGURATION_COPY.authentication).join(" ");
  assert.match(copy, /Sign-in is temporarily unavailable/);
  assert.doesNotMatch(
    copy,
    /Clerk|key|secret|environment|configur|restart|mock/i,
  );
});

test("Clerk auth styling is scoped and layered without hiding verification or recovery", () => {
  assert.equal(CLERK_APPEARANCE.cssLayerName, "clerk");
  assert.equal(CLERK_APPEARANCE.elements, undefined);
  assert.equal(CLERK_AUTH_APPEARANCE.theme, "simple");
  assert.match(CLERK_AUTH_APPEARANCE.elements.formFieldInput, /min-h-10/);
  assert.match(CLERK_AUTH_APPEARANCE.elements.formButtonPrimary, /bg-ink/);
  assert.equal(CLERK_AUTH_APPEARANCE.options.elevation, "flush");
  assert.equal(CLERK_AUTH_APPEARANCE.options.socialButtonsPlacement, "top");
  assert.equal(
    CLERK_AUTH_APPEARANCE.options.socialButtonsVariant,
    "blockButton",
  );
  const { logoBox, ...visibleElements } = CLERK_AUTH_APPEARANCE.elements;
  assert.equal(logoBox, "hidden");
  assert.doesNotMatch(
    JSON.stringify(visibleElements),
    /\bhidden\b|display[^a-z]+none|visibility[^a-z]+hidden|sr-only/,
  );
  assert.match(
    read("app/globals.css"),
    /@layer theme, base, clerk, components, utilities;/,
  );
});

test("the compact card localizes only initial copy without relabeling later auth steps", () => {
  assert.match(
    component("AppProviders"),
    /localization=\{CLERK_LOCALIZATION\}/,
  );
  assert.equal(CLERK_LOCALIZATION.dividerText, "or continue with");
  assert.deepEqual(Object.keys(CLERK_LOCALIZATION.signIn), ["start"]);
  assert.deepEqual(Object.keys(CLERK_LOCALIZATION.signUp), ["start"]);
  assert.equal(CLERK_LOCALIZATION.formButtonPrimary, undefined);
  assert.doesNotMatch(
    component("AuthLayout"),
    /<aside\b|grid-cols|<form\b|fetch\(/,
  );
});
