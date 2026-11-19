"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState, type ReactNode } from "react";
import { createApiClient } from "@/lib/api/client.ts";
import { createTransport } from "@/lib/api/transport.ts";
import { SessionApiContext } from "@/lib/session/context.ts";
import { createWriteCoordinator } from "@/lib/session/writes.ts";

export default function SessionScope({ userId, sessionId, children }: { userId: string; sessionId: string; children: ReactNode }) {
  const clerk = useClerk();
  const { getToken } = useAuth();
  const [scope] = useState(() => ({ controller: new AbortController(), alive: true }));
  const [api] = useState(() => {
    const isCurrent = () => scope.alive && clerk.session?.id === sessionId &&
      clerk.session.status === "active" && clerk.user?.id === userId;
    const client = createApiClient((spec, signal) => createTransport({
      baseUrl: process.env.NEXT_PUBLIC_API_URL,
      getToken: async () => isCurrent() ? getToken() : null,
      isCurrent,
      signal: scope.controller.signal,
    })(spec, signal));
    return { ...client, isCurrent, writes: createWriteCoordinator() };
  });
  useEffect(() => {
    // Recreate after Strict Mode's cleanup replay; old requests retain the old signal.
    if (scope.controller.signal.aborted) scope.controller = new AbortController();
    scope.alive = true;
    return () => { scope.alive = false; scope.controller.abort(); };
  }, [scope]);
  return <SessionApiContext value={api}>{children}</SessionApiContext>;
}
