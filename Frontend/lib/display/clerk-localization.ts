import type { ClerkProvider } from "@clerk/nextjs";
import type { ComponentProps } from "react";

// Only initial headings and the social/email divider are changed. Clerk's
// password, verification, recovery and MFA prompts keep their original meaning.
export const CLERK_LOCALIZATION = {
  dividerText: "or continue with",
  signIn: {
    start: {
      title: "Welcome to Career Mobility",
      titleCombined: "Welcome to Career Mobility",
      subtitle: "Your next move starts here.",
      subtitleCombined: "Your next move starts here.",
    },
  },
  signUp: {
    start: {
      title: "Create your account",
      titleCombined: "Welcome to Career Mobility",
      subtitle: "Your next move starts here.",
      subtitleCombined: "Your next move starts here.",
    },
  },
} satisfies NonNullable<ComponentProps<typeof ClerkProvider>["localization"]>;
