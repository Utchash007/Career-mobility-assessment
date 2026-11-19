export const APP_ROUTES = {
  home: "/",
  profile: "/profile",
  opportunities: "/opportunities",
  recommendations: "/recommendations",
  shortlist: "/shortlist",
  account: "/account",
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

export interface NavigationItem {
  href: AppRoute;
  label: string;
  availability: "available" | "planned";
}

// Only link to implemented screens. Later phases explicitly enable their routes.
export const NAVIGATION_ITEMS = [
  { href: APP_ROUTES.home, label: "Home", availability: "available" },
  { href: APP_ROUTES.profile, label: "Profile", availability: "available" },
  {
    href: APP_ROUTES.opportunities,
    label: "Opportunities",
    availability: "available",
  },
  {
    href: APP_ROUTES.recommendations,
    label: "Matches",
    availability: "available",
  },
  { href: APP_ROUTES.shortlist, label: "Shortlist", availability: "available" },
  { href: APP_ROUTES.account, label: "Account", availability: "planned" },
] as const satisfies readonly NavigationItem[];

export function isActiveRoute(pathname: string | null, href: AppRoute): boolean {
  if (pathname === null) return false;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
