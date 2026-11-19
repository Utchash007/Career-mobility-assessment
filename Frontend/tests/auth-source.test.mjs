import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const component = (name) => read(`components/${name}/${name}.tsx`);

test("Clerk provider stays server-side and never serializes a secret", () => {
  const source = component("AppProviders");
  assert.doesNotMatch(source, /^"use client"|secretKey=|CLERK_SECRET_KEY/);
  assert.match(source, /ClerkProvider/);
  assert.match(read("lib/auth/config.ts"), /import "server-only"/);
  assert.match(read("lib/api/server.ts"), /import "server-only"/);
  assert.match(read("next.config.ts"), /NEXT_PUBLIC_CLERK_KEYLESS_DISABLED = "true"/);
});

test("proxy uses bare Clerk middleware; missing config can only show setup", () => {
  const source = read("proxy.ts");
  assert.match(source, /clerkMiddleware\(\)/);
  assert.doesNotMatch(source, /createRouteMatcher|auth\.protect|userId|mock/);
  assert.match(source, /NextResponse\.rewrite\(new URL\("\/setup"/);
  assert.match(source, /pathname === "\/api\/health"/);
});

test("each protected page checks authorization before rendering", () => {
  function check(directory) {
    for (const entry of readdirSync(new URL(`../${directory}`, import.meta.url), { withFileTypes: true })) {
      if (entry.isDirectory()) check(`${directory}/${entry.name}`);
      else if (entry.name === "page.tsx") {
        const source = read(`${directory}/${entry.name}`);
        assert.match(source, /await auth\.protect\(\)/);
        assert.ok(source.indexOf("await auth.protect()") < source.indexOf("return <"));
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

test("auth screens compose prebuilt Clerk UI, never custom password forms", () => {
  for (const [name, widget] of [["SignInScreen", "SignIn"], ["SignUpScreen", "SignUp"]]) {
    assert.match(component(name), new RegExp(`<${widget} routing="path"`));
    assert.doesNotMatch(component(name), /type="password"|<form|fetch\(/);
  }
});
