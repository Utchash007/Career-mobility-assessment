import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { authenticationConfigured } from "@/lib/auth/config.ts";

const authenticate = clerkMiddleware();

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  // Liveness never requires identity or creates an application in keyless mode.
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();
  if (!authenticationConfigured()) {
    if (request.nextUrl.pathname === "/setup") return NextResponse.next();
    return NextResponse.rewrite(new URL("/setup", request.url));
  }
  return authenticate(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
