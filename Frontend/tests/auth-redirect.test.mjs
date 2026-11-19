import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRedirect } from "@clerk/backend/internal";

// Exercise the real pinned SDK's URL builder, not auth verification or a live
// Clerk instance. This fictional publishable key contains no identity/session.
const publishableKey = `pk_test_${Buffer.from("fictional.clerk.accounts.dev$").toString("base64")}`;
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Clerk server redirects stay on the app origin and preserve the requested page", (context) => {
  context.mock.method(globalThis, "fetch", () => {
    throw new Error("Redirect URL checks must not make network requests.");
  });
  const match = read("proxy.ts").match(
    /clerkMiddleware\(\{\s*signInUrl: "([^"]+)",\s*signUpUrl: "([^"]+)",\s*\}\)/,
  );
  assert.ok(
    match,
    "Server auth must explicitly receive the in-app route URLs.",
  );
  const [, signInUrl, signUpUrl] = match;
  assert.equal(signInUrl, "/sign-in");
  assert.equal(signUpUrl, "/sign-up");
  const provider = read("components/AppProviders/AppProviders.tsx");
  assert.ok(provider.includes(`signInUrl="${signInUrl}"`));
  assert.ok(provider.includes(`signUpUrl="${signUpUrl}"`));

  for (const origin of [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://career.example.test",
  ]) {
    for (const path of ["/", "/profile", "/shortlist?page=2"]) {
      const returnBackUrl = `${origin}${path}`;
      const redirects = createRedirect({
        publishableKey,
        baseUrl: returnBackUrl,
        signInUrl,
        signUpUrl,
        redirectAdapter: (url) => url,
      });
      for (const [method, expectedPath] of [
        ["redirectToSignIn", signInUrl],
        ["redirectToSignUp", signUpUrl],
      ]) {
        const target = new URL(redirects[method]({ returnBackUrl }));
        assert.equal(target.origin, origin);
        assert.equal(target.pathname, expectedPath);
        assert.equal(target.searchParams.get("redirect_url"), returnBackUrl);
        assert.doesNotMatch(target.hostname, /accounts\.dev$/);
      }
    }
  }
});
