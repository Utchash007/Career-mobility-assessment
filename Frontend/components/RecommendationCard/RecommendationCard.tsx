import { Button, Card } from "flowbite-react";
import Link from "next/link";
import type { ReactNode } from "react";
import OpportunityMeta from "@/components/OpportunityMeta/OpportunityMeta";
import MatchLabelBadge from "@/components/MatchLabelBadge/MatchLabelBadge";
import EligibilityFlags from "@/components/EligibilityFlags/EligibilityFlags";
import MatchScore from "@/components/MatchScore/MatchScore";
import MatchSummary from "@/components/MatchSummary/MatchSummary";
import type { MatchListItem } from "@/lib/contracts/match.ts";
import { opportunityDetailHref, type DetailContext } from "@/lib/queries/details.ts";

export default function RecommendationCard({ item, context, children }: { item: MatchListItem; context?: DetailContext; children?: ReactNode }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">{item.opportunity.title}</h2>
      <OpportunityMeta opportunity={item.opportunity} />
      <MatchLabelBadge label={item.match.label} />
      <EligibilityFlags flags={item.match.flags} />
      <MatchScore score={item.match.overall_score} evaluated={item.match.criteria_evaluated} />
      <MatchSummary match={item.match} />
      <Button as={Link} color="alternative" href={opportunityDetailHref(item.opportunity.id, context)}>View full breakdown</Button>
      {children}
    </Card>
  );
}
