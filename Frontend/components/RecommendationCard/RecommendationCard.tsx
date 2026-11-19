import { Card } from "flowbite-react";
import type { ReactNode } from "react";
import EligibilityFlags from "@/components/EligibilityFlags/EligibilityFlags";
import LinkButton from "@/components/LinkButton/LinkButton";
import MatchLabelBadge from "@/components/MatchLabelBadge/MatchLabelBadge";
import MatchScore from "@/components/MatchScore/MatchScore";
import MatchSummary from "@/components/MatchSummary/MatchSummary";
import OpportunityMeta from "@/components/OpportunityMeta/OpportunityMeta";
import type { MatchListItem } from "@/lib/contracts/match.ts";
import {
  type DetailContext,
  opportunityDetailHref,
} from "@/lib/queries/details.ts";

export default function RecommendationCard({
  item,
  context,
  children,
}: {
  item: MatchListItem;
  context?: DetailContext;
  children?: ReactNode;
}) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">{item.opportunity.title}</h2>
      <OpportunityMeta opportunity={item.opportunity} />
      <MatchLabelBadge label={item.match.label} />
      <EligibilityFlags flags={item.match.flags} />
      <MatchScore
        score={item.match.overall_score}
        evaluated={item.match.criteria_evaluated}
      />
      <MatchSummary match={item.match} />
      <LinkButton
        color="alternative"
        href={opportunityDetailHref(item.opportunity.id, context)}
      >
        View full breakdown
      </LinkButton>
      {children}
    </Card>
  );
}
