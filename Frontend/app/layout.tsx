import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppProviders from "@/components/AppProviders/AppProviders";
import AppShell from "@/components/AppShell/AppShell";
import "./globals.css";

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
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
