"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "flowbite-react";
import ErrorState from "@/components/ErrorState/ErrorState";
import LinkButton from "@/components/LinkButton/LinkButton";

export default function SessionRecovery() {
  return (
    <div className="space-y-4">
      <ErrorState reason="session_expired" />
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/sign-in">Continue to sign in</LinkButton>
        <SignOutButton redirectUrl="/sign-in">
          <Button color="alternative">Sign out</Button>
        </SignOutButton>
      </div>
    </div>
  );
}
