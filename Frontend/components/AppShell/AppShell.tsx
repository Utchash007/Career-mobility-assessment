import type { ReactNode } from "react";
import AppNavigation from "@/components/AppNavigation/AppNavigation";
import type { NavigationItem } from "@/lib/display/navigation.ts";

export interface AppShellProps {
  children: ReactNode;
  account?: ReactNode;
  navigationItems?: readonly NavigationItem[];
}

export default function AppShell({
  children,
  account,
  navigationItems,
}: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-action px-4 py-3 font-medium text-canvas focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <AppNavigation items={navigationItems} account={account} />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12"
      >
        {children}
      </main>
      <footer className="border-t border-accent/25 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs leading-5 text-ink">
          <p>Career Mobility — assessment prototype</p>
          <p>Matching logic belongs to the backend, not this interface.</p>
        </div>
      </footer>
    </div>
  );
}
