import type { ReactNode } from "react";
import ProtectedAppShell from "@/components/ProtectedAppShell/ProtectedAppShell";

export default function Layout({ children }: { children: ReactNode }) {
  return <ProtectedAppShell>{children}</ProtectedAppShell>;
}
