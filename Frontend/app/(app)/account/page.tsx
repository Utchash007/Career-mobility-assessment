import { auth } from "@clerk/nextjs/server";
import AccountScreen from "@/components/AccountScreen/AccountScreen";

export default async function Page() {
  await auth.protect();
  return <AccountScreen />;
}
