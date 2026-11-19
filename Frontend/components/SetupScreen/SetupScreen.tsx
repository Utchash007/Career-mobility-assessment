import { Button } from "flowbite-react";
import AuthLayout from "@/components/AuthLayout/AuthLayout";
import ConfigurationNotice from "@/components/ConfigurationNotice/ConfigurationNotice";

export default function SetupScreen() {
  return (
    <AuthLayout>
      <header className="mb-6 space-y-1 text-center">
        <h1 className="text-lg font-semibold">Welcome to Career Mobility</h1>
        <p className="text-xs text-ink/70">Your next move starts here.</p>
      </header>
      <ConfigurationNotice kind="authentication" />
      <Button
        as="a"
        href="/sign-in"
        className="mt-5 w-full rounded bg-ink text-canvas hover:bg-ink/85"
      >
        Try again
      </Button>
    </AuthLayout>
  );
}
