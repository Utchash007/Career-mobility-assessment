// Minimal structural subset: no Clerk runtime import or identity/token data here.
export interface ClerkDisplayIdentity {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
}

export function clerkDisplayName(user: ClerkDisplayIdentity): string {
  const fullName = user.fullName?.trim();
  if (fullName) return fullName;

  const combined = [user.firstName?.trim(), user.lastName?.trim()]
    .filter(Boolean)
    .join(" ");
  if (combined) return combined;

  const emailLocalPart = user.primaryEmailAddress?.emailAddress
    .split("@", 1)[0]
    ?.trim();
  return emailLocalPart || "User";
}
