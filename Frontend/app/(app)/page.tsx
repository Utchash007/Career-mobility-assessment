import { auth } from "@clerk/nextjs/server";
import DashboardScreen from "@/components/DashboardScreen/DashboardScreen";

export default async function HomePage() {
  await auth.protect();
  return <DashboardScreen />;
}
