import { Card } from "flowbite-react";
import DeleteApplicationDataAction from "@/components/DeleteApplicationDataAction/DeleteApplicationDataAction";

export default function AccountScreen() {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="space-y-2"><h1 className="text-3xl font-semibold">Account and application data</h1><p className="text-sm leading-6">Identity and assessment data are managed separately.</p></div>
      <Card><h2 className="text-xl font-semibold">Your Clerk identity</h2><p className="text-sm leading-6">Use the Clerk identity menu in the navigation header to manage your identity and sign out. This application does not implement its own password, token or login endpoint.</p><p className="text-sm">The application-data action below does not call Clerk identity deletion.</p></Card>
      <Card><h2 className="text-xl font-semibold">Your application data</h2><p className="text-sm leading-6">Your profile and private notes are stored by the backend for your verified identity. Work authorisation is self-declared and matching is a prototype, not legal advice or an employment guarantee.</p><DeleteApplicationDataAction /></Card>
    </div>
  );
}
