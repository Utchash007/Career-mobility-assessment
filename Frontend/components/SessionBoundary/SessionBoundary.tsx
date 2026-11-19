"use client";

import { useAuth, useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import LoadingState from "@/components/LoadingState/LoadingState";
import SessionRecovery from "@/components/SessionRecovery/SessionRecovery";
import SessionScope from "@/components/SessionScope/SessionScope";

export default function SessionBoundary({
  expectedUserId,
  expectedSessionId,
  children,
}: {
  expectedUserId: string;
  expectedSessionId: string;
  children: ReactNode;
}) {
  const auth = useAuth();
  const { session, isLoaded } = useSession();
  const router = useRouter();
  const active =
    auth.isLoaded &&
    isLoaded &&
    auth.isSignedIn &&
    session?.status === "active";
  const matches =
    active &&
    auth.userId === expectedUserId &&
    session.id === expectedSessionId;
  useEffect(() => {
    if (active && !matches) router.refresh();
  }, [active, matches, router]);
  if (!auth.isLoaded || !isLoaded || (active && !matches))
    return <LoadingState />;
  if (!matches || !auth.userId || !session) return <SessionRecovery />;
  return (
    <SessionScope
      key={`${auth.userId}:${session.id}`}
      userId={auth.userId}
      sessionId={session.id}
    >
      {children}
    </SessionScope>
  );
}
