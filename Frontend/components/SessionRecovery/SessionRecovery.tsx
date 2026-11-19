"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "flowbite-react";
import Link from "next/link";
import ErrorState from "@/components/ErrorState/ErrorState";

export default function SessionRecovery() {
  return (
    <div className="space-y-4">
      <ErrorState reason="session_expired" />
      <div className="flex flex-wrap gap-3">
        <Button as={Link} href="/sign-in">Continue to sign in</Button>
        <SignOutButton redirectUrl="/sign-in"><Button color="alternative">Sign out</Button></SignOutButton>
      </div>
    </div>
  );
}
