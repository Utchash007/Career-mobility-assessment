"use client";

import { Navbar, NavbarBrand } from "flowbite-react";
import Link from "next/link";
import type { ReactNode } from "react";
import NavigationMenu from "@/components/NavigationMenu/NavigationMenu";
import {
  APP_ROUTES,
  NAVIGATION_ITEMS,
  type NavigationItem,
} from "@/lib/display/navigation.ts";

export interface AppNavigationProps {
  items?: readonly NavigationItem[];
  account?: ReactNode;
}

export default function AppNavigation({
  items = NAVIGATION_ITEMS,
  account,
}: AppNavigationProps) {
  return (
    <header>
      <Navbar fluid aria-label="Primary navigation">
        <NavbarBrand as={Link} href={APP_ROUTES.home}>
          <span className="flex size-10 items-center justify-center rounded-xl bg-action text-sm font-bold text-canvas">
            CM
          </span>
          <span className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-ink">
              Career Mobility
            </span>
            <span className="text-xs font-medium text-action">Prototype</span>
          </span>
        </NavbarBrand>
        {account ? (
          <div className="flex items-center gap-3">{account}</div>
        ) : null}
        <NavigationMenu items={items} />
      </Navbar>
    </header>
  );
}
