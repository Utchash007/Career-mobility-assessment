import type { ClerkProvider, SignIn } from "@clerk/nextjs";
import type { ComponentProps } from "react";
import { THEME_COLORS } from "./palette.ts";

export const CLERK_APPEARANCE = {
  cssLayerName: "clerk",
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

// Scope card/form overrides to auth screens; account and verification UI keep
// their own layouts. Do not hide step headings, recovery actions or MFA fields.
export const CLERK_AUTH_APPEARANCE = {
  theme: "simple",
  options: {
    elevation: "flush",
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: THEME_COLORS.text,
    colorPrimaryForeground: THEME_COLORS.canvas,
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full",
    // AuthLayout supplies the app mark; leave Clerk's footer branding intact.
    logoBox: "hidden",
    cardBox: "w-full border-0 bg-transparent shadow-none",
    card: "w-full rounded-none bg-transparent p-0 shadow-none",
    header: "items-center gap-1 text-center",
    headerTitle: "text-center text-lg font-semibold text-ink",
    headerSubtitle: "text-center text-xs text-ink/70",
    formFieldLabel: "text-xs font-medium text-ink",
    formFieldInput:
      "min-h-10 rounded border border-ink/25 bg-canvas px-3 text-sm text-ink focus:border-action",
    formButtonPrimary:
      "min-h-10 rounded bg-ink text-xs font-semibold text-canvas shadow-none hover:bg-ink/85",
    socialButtonsRoot: "gap-2",
    socialButtonsBlockButton:
      "min-h-9 rounded border border-ink/25 bg-canvas text-xs text-ink shadow-none hover:bg-soft-accent/15",
    socialButtonsBlockButtonText: "text-xs font-medium",
    dividerText: "text-xs text-ink/70",
    footer: "bg-transparent px-0",
    footerActionText: "text-xs text-ink/70",
    footerActionLink:
      "text-xs font-semibold text-action hover:text-action-hover",
  },
} satisfies NonNullable<ComponentProps<typeof SignIn>["appearance"]>;
