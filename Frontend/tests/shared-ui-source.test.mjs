import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CONFIGURATION_COPY,
  ERROR_COPY,
} from "../lib/display/feedback.ts";
import { APP_THEME } from "../lib/display/flowbite-theme.ts";

// These are source/pure-data checks, not renderer, hydration or browser tests.
function component(name) {
  return readFileSync(
    new URL(`../components/${name}/${name}.tsx`, import.meta.url),
    "utf8",
  );
}

test("shared errors use fixed safe copy rather than raw exception props", () => {
  const source = component("ErrorState");
  assert.match(source, /ERROR_COPY\[reason\]/);
  assert.doesNotMatch(source, /error\.message|JSON\.stringify|console\./);
  assert.match(source, /disabled=\{pending\}/);
  for (const copy of Object.values(ERROR_COPY)) {
    assert.ok(copy.title.length > 0);
    assert.ok(copy.description.length > 0);
    assert.doesNotMatch(copy.description, /stack trace|https?:\/\//i);
  }
});

test("the Next route error adapter uses stable refetch recovery without logging errors", () => {
  const source = readFileSync(
    new URL("../app/error.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /onRetry=\{retry\}/);
  assert.doesNotMatch(source, /reset|console\.|error\.message/);
});

test("configuration notices receive a kind, never environment values", () => {
  const source = component("ConfigurationNotice");
  assert.match(source, /kind: ConfigurationKind/);
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(/);
  for (const copy of Object.values(CONFIGURATION_COPY)) {
    assert.ok(copy.title.length > 0);
    assert.ok(copy.description.length > 0);
    assert.ok(copy.nextStep.length > 0);
  }
});

test("the shared dialog has explicit callbacks, safe initial focus and pending guards", () => {
  const source = component("ConfirmationDialog");
  assert.match(source, /initialFocus=\{cancelRef\}/);
  assert.match(source, /ref=\{cancelRef\}/);
  assert.match(source, /dismissible=\{!pending\}/);
  assert.match(source, /aria-describedby=\{descriptionId\}/);
  assert.match(source, /if \(!pending\) onConfirm\(\)/);
  assert.match(source, /if \(!pending\) onCancel\(\)/);
  assert.equal(source.match(/disabled=\{pending\}/g)?.length, 2);
  assert.doesNotMatch(source, /fetch\(|useEffect|localStorage|sessionStorage/);
});

test("navigation ARIA reads Flowbite's state instead of duplicating it", () => {
  const source = component("NavigationMenu");
  assert.match(source, /useNavbarContext\(\)/);
  assert.match(source, /aria-expanded=\{isOpen \?\? false\}/);
  assert.match(source, /aria-controls=\{menuId\}/);
  assert.match(source, /NavbarCollapse id=\{menuId\}/);
  assert.doesNotMatch(source, /useState|useEffect/);
});

test("the shell owns one focusable main landmark and a working skip target in source", () => {
  const source = component("AppShell");
  assert.equal(source.match(/<main\b/g)?.length, 1);
  assert.match(source, /href="#main-content"/);
  assert.match(source, /id="main-content"/);
  assert.match(source, /tabIndex=\{-1\}/);
  assert.match(source, /<AppNavigation\b/);
});

test("the provider initializes the generated light theme before its child subtree", () => {
  const source = component("FlowbiteProvider");
  assert.match(source, /import \{ ThemeInit \} from "@\/\.flowbite-react\/init"/);
  assert.match(source, /ThemeProvider theme=\{APP_THEME\} applyTheme="replace"/);
  assert.ok(source.indexOf("<ThemeInit />") < source.indexOf("{children}"));
  const config = JSON.parse(
    readFileSync(new URL("../.flowbite-react/config.json", import.meta.url), "utf8"),
  );
  assert.equal(config.dark, false);
  assert.equal(config.version, 4);
});

test("the shared Flowbite theme uses palette tokens and distinct semantic colors", () => {
  assert.match(APP_THEME.button.color.default, /bg-action text-canvas/);
  assert.match(APP_THEME.button.color.alternative, /text-action/);
  assert.match(APP_THEME.button.color.failure, /bg-critical/);
  assert.match(APP_THEME.alert.color.warning, /text-verification/);
  assert.match(APP_THEME.alert.color.success, /text-success/);
  assert.match(APP_THEME.navbar.collapse.base, /lg:block/);
  assert.match(APP_THEME.navbar.toggle.base, /lg:hidden/);
  assert.doesNotMatch(JSON.stringify(APP_THEME), /dark:|#[\da-f]{3,8}/i);
});

test("foundation-only components neither fetch private data nor import runtime fixtures", () => {
  for (const name of [
    "LoadingState",
    "EmptyState",
    "ErrorState",
    "ProfileRequiredState",
    "ConfigurationNotice",
    "ConfirmationDialog",
    "NavigationMenu",
    "AppNavigation",
    "AppShell",
    "NotFoundScreen",
    "WorkflowPreviewCard",
  ]) {
    assert.doesNotMatch(
      component(name),
      /fetch\(|process\.env|tests\/fixtures|localStorage|sessionStorage|Authorization:/,
      name,
    );
  }
});
