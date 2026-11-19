import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createApiClient } from "./client.ts";
import { ApiFailure } from "./errors.ts";
import { createTransport } from "./transport.ts";

export async function serverApi() {
  const session = await auth();
  if (!session.isAuthenticated || session.sessionStatus !== "active") throw new ApiFailure("session_expired", 401);
  return createApiClient(createTransport({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    getToken: () => session.getToken(),
  }));
}
