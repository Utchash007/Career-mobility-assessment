import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";
import LoadingState from "@/components/LoadingState/LoadingState";

export default function SignUpScreen() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center gap-8 px-4 py-12">
      <Link href="/" className="font-semibold text-action">
        Career Mobility
      </Link>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Start your journey</h1>
        <p className="text-sm">
          Clerk manages your identity. Application data remains separate.
        </p>
      </div>
      <Suspense fallback={<LoadingState />}>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </Suspense>
    </main>
  );
}
