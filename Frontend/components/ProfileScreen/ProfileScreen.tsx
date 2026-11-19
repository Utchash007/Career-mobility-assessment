import { currentUser } from "@clerk/nextjs/server";
import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import ProfileForm from "@/components/ProfileForm/ProfileForm";
import { asApiFailure, isMissingProfile } from "@/lib/api/errors.ts";
import { serverApi } from "@/lib/api/server.ts";
import { utcToday } from "@/lib/contracts/profile.ts";
import { clerkDisplayName } from "@/lib/display/identity.ts";

export default async function ProfileScreen() {
  const [profile, user] = await Promise.allSettled([
    serverApi().then((api) => api.getProfile()),
    currentUser(),
  ]);
  if (user.status === "rejected" || !user.value) return <ApiFeedback reason="session_expired" />;
  if (profile.status === "rejected" && !isMissingProfile(profile.reason)) return <ApiFeedback reason={asApiFailure(profile.reason).reason} />;
  return (
    <div className="space-y-8">
      <div className="space-y-2"><h1 className="text-3xl font-semibold">Your profile</h1><p className="text-sm leading-6">Describe what you know; leave unspecified values unknown. Saving replaces your complete application profile.</p></div>
      <ProfileForm initialProfile={profile.status === "fulfilled" ? profile.value : null} displayName={clerkDisplayName(user.value)} today={utcToday()} />
    </div>
  );
}
