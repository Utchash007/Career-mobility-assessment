import { auth } from "@clerk/nextjs/server";
import ProfileScreen from "@/components/ProfileScreen/ProfileScreen";

export default async function Page() {
  await auth.protect();
  return <ProfileScreen />;
}
