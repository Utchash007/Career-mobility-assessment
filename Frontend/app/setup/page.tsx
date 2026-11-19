import type { Metadata } from "next";
import SetupScreen from "@/components/SetupScreen/SetupScreen";

export const metadata: Metadata = { title: "Sign-in unavailable" };

export default function Page() {
  return <SetupScreen />;
}
