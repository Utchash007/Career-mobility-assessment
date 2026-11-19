import type { Metadata } from "next";
import SignUpScreen from "@/components/SignUpScreen/SignUpScreen";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return <SignUpScreen />;
}
