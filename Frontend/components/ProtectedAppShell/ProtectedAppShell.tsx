import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell/AppShell";
import SessionBoundary from "@/components/SessionBoundary/SessionBoundary";

export default async function ProtectedAppShell({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session.isAuthenticated || !session.userId || !session.sessionId)
    return session.redirectToSignIn();
  return (
    <SessionBoundary
      expectedUserId={session.userId}
      expectedSessionId={session.sessionId}
    >
      <AppShell account={<UserButton />}>{children}</AppShell>
    </SessionBoundary>
  );
}
