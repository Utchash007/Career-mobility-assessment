import Link from "next/link";
import type { ReactNode } from "react";

export interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <section
        aria-label="Career Mobility account access"
        className="w-full min-w-0 max-w-sm rounded-lg border border-ink/15 bg-canvas p-6 sm:p-8"
      >
        <Link
          href="/"
          aria-label="Career Mobility home"
          className="mx-auto mb-5 flex size-9 items-center justify-center rounded bg-ink text-xs font-semibold text-canvas"
        >
          <span aria-hidden="true">CM</span>
        </Link>
        {children}
      </section>
    </main>
  );
}
