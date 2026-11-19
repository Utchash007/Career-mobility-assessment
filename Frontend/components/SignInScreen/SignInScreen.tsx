import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";
import LoadingState from "@/components/LoadingState/LoadingState";

export default function SignInScreen() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center gap-8 px-4 py-12">
      <Link href="/" className="font-semibold text-action">
        Career Mobility
      </Link>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="text-sm">
          Sign in securely with Clerk to continue your assessment.
        </p>
      </div>
      <Suspense fallback={<LoadingState />}>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </Suspense>
    </main>
  );
}
