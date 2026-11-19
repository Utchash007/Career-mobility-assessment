"use client";

import { ThemeProvider } from "flowbite-react";
import type { ReactNode } from "react";
import { ThemeInit } from "@/.flowbite-react/init";
import { APP_THEME } from "@/lib/display/flowbite-theme.ts";

export default function FlowbiteProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ThemeProvider theme={APP_THEME} applyTheme="replace">
      <ThemeInit />
      {children}
    </ThemeProvider>
  );
}
