import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import FlowbiteProvider from "@/components/FlowbiteProvider/FlowbiteProvider";
import { authenticationConfigured } from "@/lib/auth/config.ts";
import { CLERK_APPEARANCE } from "@/lib/display/clerk-appearance.ts";
import { CLERK_LOCALIZATION } from "@/lib/display/clerk-localization.ts";

export interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  if (!authenticationConfigured())
    return <FlowbiteProvider>{children}</FlowbiteProvider>;
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={CLERK_APPEARANCE}
      localization={CLERK_LOCALIZATION}
    >
      <FlowbiteProvider>{children}</FlowbiteProvider>
    </ClerkProvider>
  );
}
