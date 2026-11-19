// Keep the exact palette synchronized with the Tailwind tokens in app/globals.css.
export const PALETTE = {
  cream: "#EFECE3",
  lightBlue: "#8FABD4",
  blue: "#4A70A9",
  black: "#000000",
} as const;

export const THEME_COLORS = {
  canvas: PALETTE.cream,
  text: PALETTE.black,
  softAccent: PALETTE.lightBlue,
  accent: PALETTE.blue,
  // Palette blue mixed with 25% black for readable small cream text.
  action: "#38547F",
  actionHover: "#2D4366",
  actionText: PALETTE.cream,
  critical: "#991B1B",
  verification: "#854D0E",
  success: "#166534",
} as const;
