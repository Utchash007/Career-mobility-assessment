import { Card } from "flowbite-react";
import LinkButton from "@/components/LinkButton/LinkButton";
import OpportunityMeta from "@/components/OpportunityMeta/OpportunityMeta";
import ShortlistAction from "@/components/ShortlistAction/ShortlistAction";
import ShortlistNoteEditor from "@/components/ShortlistNoteEditor/ShortlistNoteEditor";
import type { ShortlistItem } from "@/lib/contracts/shortlist.ts";
import {
  type DetailContext,
  opportunityDetailHref,
} from "@/lib/queries/details.ts";

export default function ShortlistCard({
  item,
  context,
}: {
  item: ShortlistItem;
  context: DetailContext;
}) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">{item.opportunity.title}</h2>
      <OpportunityMeta opportunity={item.opportunity} />
      <p className="text-xs">
        Saved{" "}
        <time dateTime={item.created_at}>
          {new Date(item.created_at).toLocaleString("en-GB", {
            timeZone: "UTC",
          })}{" "}
          UTC
        </time>
      </p>
      <LinkButton
        color="alternative"
        href={opportunityDetailHref(item.opportunity_id, context)}
      >
        View details
      </LinkButton>
      <ShortlistNoteEditor item={item} />
      <ShortlistAction opportunityId={item.opportunity_id} initialSaved />
    </Card>
  );
}
