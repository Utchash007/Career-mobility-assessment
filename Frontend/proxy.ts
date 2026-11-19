import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import { authenticationConfigured } from "@/lib/auth/config.ts";

// Server auth redirects do not inherit the browser ClerkProvider's URLs.
// Keep authentication pages in this app rather than Clerk's hosted portal.
const authenticate = clerkMiddleware({
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  // Liveness never requires identity or creates an application in keyless mode.
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();
  // In the single-container deployment, these paths are transport-only rewrites.
  // FastAPI still verifies every business API token; Clerk protects app pages.
  if (
    process.env.PANAMA_SINGLE_CONTAINER === "true" &&
    (request.nextUrl.pathname === "/health" ||
      request.nextUrl.pathname === "/api/v1" ||
      request.nextUrl.pathname.startsWith("/api/v1/"))
  )
    return NextResponse.next();
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
