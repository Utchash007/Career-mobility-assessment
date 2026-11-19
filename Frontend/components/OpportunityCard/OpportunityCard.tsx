import { Card } from "flowbite-react";
import type { ReactNode } from "react";
import LinkButton from "@/components/LinkButton/LinkButton";
import OpportunityMeta from "@/components/OpportunityMeta/OpportunityMeta";
import type { OpportunitySummary } from "@/lib/contracts/opportunity.ts";
import { keyLabel } from "@/lib/display/labels.ts";
import {
  type DetailContext,
  opportunityDetailHref,
} from "@/lib/queries/details.ts";

export default function OpportunityCard({
  opportunity,
  context,
  children,
}: {
  opportunity: OpportunitySummary;
  context?: DetailContext;
  children?: ReactNode;
}) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">{opportunity.title}</h2>
      <OpportunityMeta opportunity={opportunity} />
      <p className="text-sm leading-6">
        <span className="font-semibold">Required skills: </span>
        {opportunity.required_skills.map(keyLabel).join(", ") ||
          "None specified"}
      </p>
      <p className="text-sm leading-6">
        <span className="font-semibold">Preferred skills: </span>
        {opportunity.preferred_skills.map(keyLabel).join(", ") ||
          "None specified"}
      </p>
      <LinkButton
        color="alternative"
        href={opportunityDetailHref(opportunity.id, context)}
      >
        View requirements and fit
      </LinkButton>
      {children}
    </Card>
  );
}
