import { Alert } from "flowbite-react";
import type { EligibilityFlag } from "@/lib/contracts/match.ts";
import { SEVERITY_LABELS } from "@/lib/display/labels.ts";

export default function EligibilityFlags({ flags }: { flags: EligibilityFlag[] }) {
  if (flags.length === 0) return <p className="text-sm">No eligibility flags were returned. This does not verify permission to work.</p>;
  return (
    <section aria-label="Eligibility findings" className="space-y-3">
      {flags.map((flag, index) => <Alert key={`${flag.code}-${index}`} color={flag.severity === "critical" ? "failure" : flag.severity === "verify" ? "warning" : "info"}>
        <p className="font-semibold">{SEVERITY_LABELS[flag.severity]}</p><p className="mt-1 whitespace-pre-wrap text-sm">{flag.message}</p>
      </Alert>)}
    </section>
  );
}
