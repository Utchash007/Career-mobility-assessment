"use client";

import { Button } from "flowbite-react";
import Link from "next/link";
import type { ReactNode } from "react";

// Keep component-valued `as` inside a client module, not in serialized RSC props.
export default function LinkButton({
  href,
  color = "default",
  children,
}: {
  href: string;
  color?: "default" | "alternative";
  children: ReactNode;
}) {
  return (
    <Button as={Link} href={href} color={color}>
      {children}
    </Button>
  );
}
