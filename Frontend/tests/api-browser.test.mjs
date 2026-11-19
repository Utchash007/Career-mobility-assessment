import assert from "node:assert/strict";
import test from "node:test";
import { browserApiBase } from "../lib/api/browser.ts";

test("single-container browser calls use the current origin, not copied loopback settings", (t) => {
  const previousFlag = process.env.NEXT_PUBLIC_API_SAME_ORIGIN;
  const previousUrl = process.env.NEXT_PUBLIC_API_URL;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  t.after(() => {
    for (const [name, value] of [
      ["NEXT_PUBLIC_API_SAME_ORIGIN", previousFlag],
      ["NEXT_PUBLIC_API_URL", previousUrl],
    ]) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow);
    else delete globalThis.window;
  });

  process.env.NEXT_PUBLIC_API_SAME_ORIGIN = "true";
  process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8000";
  const location = {
    origin: "https://career-mobility-assessment.onrender.com",
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location },
  });
  assert.equal(browserApiBase(), location.origin);
  location.origin = "https://careers.example";
  assert.equal(browserApiBase(), location.origin);

  delete globalThis.window;
  assert.equal(browserApiBase(), undefined);
  process.env.NEXT_PUBLIC_API_SAME_ORIGIN = "false";
  assert.equal(browserApiBase(), "http://127.0.0.1:8000");
});
