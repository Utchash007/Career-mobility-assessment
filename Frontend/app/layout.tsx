import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppProviders from "@/components/AppProviders/AppProviders";
import "./globals.css";

// Evaluate the server-owned Clerk configuration at request time. Docker builds
// receive public values only; CLERK_SECRET_KEY is supplied at runtime by Render.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Career Mobility",
    template: "%s | Career Mobility",
  },
  description:
    "A career mobility assessment prototype with structured profiles and explainable opportunity matching.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
