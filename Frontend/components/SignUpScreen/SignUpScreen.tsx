import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import AuthLayout from "@/components/AuthLayout/AuthLayout";
import LoadingState from "@/components/LoadingState/LoadingState";
import { CLERK_AUTH_APPEARANCE } from "@/lib/display/clerk-appearance.ts";

export default function SignUpScreen() {
  return (
    <AuthLayout>
      <Suspense fallback={<LoadingState label="Loading sign-up form..." />}>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
          appearance={CLERK_AUTH_APPEARANCE}
          fallback={<LoadingState label="Loading sign-up form..." />}
        />
      </Suspense>
    </AuthLayout>
  );
}
