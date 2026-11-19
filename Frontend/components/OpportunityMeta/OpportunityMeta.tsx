import { Badge } from "flowbite-react";
import type { OpportunitySummary } from "@/lib/contracts/opportunity.ts";
import { countryLabel, EXPERIENCE_LEVEL_LABELS, OPPORTUNITY_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/display/labels.ts";

export default function OpportunityMeta({ opportunity }: { opportunity: OpportunitySummary }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium">{opportunity.organisation}</p>
      <p>{[opportunity.city, countryLabel(opportunity.country)].filter(Boolean).join(", ")}</p>
      <div className="flex flex-wrap gap-2">
        <Badge color="info">{OPPORTUNITY_TYPE_LABELS[opportunity.type]}</Badge>
        <Badge color="gray">{WORK_MODE_LABELS[opportunity.work_mode]}</Badge>
        <Badge color="gray">{EXPERIENCE_LEVEL_LABELS[opportunity.experience_level]}</Badge>
      </div>
      <p>{opportunity.max_years === null ? `${opportunity.min_years}+ years · no maximum specified` : `${opportunity.min_years}–${opportunity.max_years} years of experience`}</p>
    </div>
  );
}
