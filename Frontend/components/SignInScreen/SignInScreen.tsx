import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import AuthLayout from "@/components/AuthLayout/AuthLayout";
import LoadingState from "@/components/LoadingState/LoadingState";
import { CLERK_AUTH_APPEARANCE } from "@/lib/display/clerk-appearance.ts";

export default function SignInScreen() {
  return (
    <AuthLayout>
      <Suspense fallback={<LoadingState label="Loading sign-in form..." />}>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          appearance={CLERK_AUTH_APPEARANCE}
          fallback={<LoadingState label="Loading sign-in form..." />}
        />
      </Suspense>
    </AuthLayout>
  );
}
