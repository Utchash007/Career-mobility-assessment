"use client";

import {
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
  useNavbarContext,
} from "flowbite-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import {
  isActiveRoute,
  type NavigationItem,
} from "@/lib/display/navigation.ts";

export interface NavigationMenuProps {
  items: readonly NavigationItem[];
}

export default function NavigationMenu({ items }: NavigationMenuProps) {
  const pathname = usePathname();
  const menuId = useId();
  // Flowbite remains the single menu-state owner; ARIA reflects its actual state.
  const { isOpen } = useNavbarContext();

  return (
    <>
      <NavbarToggle
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen ?? false}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
      />
      <NavbarCollapse id={menuId}>
        {items.map((item) => {
          if (item.availability === "planned") {
            return (
              <li key={item.href}>
                <span className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink">
                  {item.label}
                  <span className="rounded bg-soft-accent/30 px-1.5 py-0.5 text-[10px] font-medium">
                    Soon
                  </span>
                </span>
              </li>
            );
          }

          const active = isActiveRoute(pathname, item.href);
          return (
            <NavbarLink
              key={item.href}
              as={Link}
              href={item.href}
              active={active}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </NavbarLink>
          );
        })}
      </NavbarCollapse>
    </>
  );
}
