import type { Metadata } from "next";
import SignInScreen from "@/components/SignInScreen/SignInScreen";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return <SignInScreen />;
}
