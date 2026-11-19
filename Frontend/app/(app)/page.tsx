import { auth } from "@clerk/nextjs/server";
import HomeScreen from "@/components/HomeScreen/HomeScreen";

export default async function HomePage() {
  await auth.protect();
  return <HomeScreen />;
}
