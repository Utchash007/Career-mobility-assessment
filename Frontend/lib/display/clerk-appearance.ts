import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/nextjs";
import { THEME_COLORS } from "./palette.ts";

export const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: THEME_COLORS.action,
    colorPrimaryForeground: THEME_COLORS.canvas,
    colorBackground: THEME_COLORS.canvas,
    colorForeground: THEME_COLORS.text,
    colorInput: THEME_COLORS.canvas,
    colorInputForeground: THEME_COLORS.text,
    colorNeutral: THEME_COLORS.text,
    borderRadius: "0.75rem",
  },
} satisfies NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;
