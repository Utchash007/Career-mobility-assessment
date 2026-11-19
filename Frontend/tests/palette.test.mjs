import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PALETTE, THEME_COLORS } from "../lib/display/palette.ts";

function luminance(hex) {
  const [red, green, blue] = hex.match(/[\da-f]{2}/gi).map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("palette matches Color Hunt and the declared Tailwind theme", () => {
  assert.deepEqual(Object.values(PALETTE), [
    "#EFECE3",
    "#8FABD4",
    "#4A70A9",
    "#000000",
  ]);
  const css = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  for (const color of [
    ...Object.values(PALETTE),
    ...Object.values(THEME_COLORS),
  ]) {
    assert.ok(css.toUpperCase().includes(color.toUpperCase()), color);
  }
});

test("intended normal-text pairs meet WCAG AA contrast", () => {
  const pairs = [
    [THEME_COLORS.text, THEME_COLORS.canvas],
    [THEME_COLORS.text, THEME_COLORS.softAccent],
    [THEME_COLORS.actionText, THEME_COLORS.action],
    [THEME_COLORS.actionText, THEME_COLORS.actionHover],
    [THEME_COLORS.critical, THEME_COLORS.canvas],
    [THEME_COLORS.verification, THEME_COLORS.canvas],
    [THEME_COLORS.success, THEME_COLORS.canvas],
  ];
  for (const [foreground, background] of pairs) {
    assert.ok(
      contrast(foreground, background) >= 4.5,
      `${foreground} on ${background}`,
    );
  }
});
