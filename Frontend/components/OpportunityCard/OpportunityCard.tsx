import { Card } from "flowbite-react";
import type { ReactNode } from "react";
import OpportunityMeta from "@/components/OpportunityMeta/OpportunityMeta";
import type { OpportunitySummary } from "@/lib/contracts/opportunity.ts";
import { keyLabel } from "@/lib/display/labels.ts";

export default function OpportunityCard({ opportunity, children }: { opportunity: OpportunitySummary; children?: ReactNode }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">{opportunity.title}</h2>
      <OpportunityMeta opportunity={opportunity} />
      <p className="text-sm leading-6"><span className="font-semibold">Required skills: </span>{opportunity.required_skills.map(keyLabel).join(", ") || "None specified"}</p>
      <p className="text-sm leading-6"><span className="font-semibold">Preferred skills: </span>{opportunity.preferred_skills.map(keyLabel).join(", ") || "None specified"}</p>
      <p className="text-xs text-action">Full requirements will be available with the detail screen.</p>
      {children}
    </Card>
  );
}
