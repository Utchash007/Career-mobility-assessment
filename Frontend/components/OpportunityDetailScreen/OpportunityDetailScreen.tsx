import Link from "next/link";
import { notFound } from "next/navigation";
import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import MatchPanel from "@/components/MatchPanel/MatchPanel";
import OpportunityMeta from "@/components/OpportunityMeta/OpportunityMeta";
import OpportunityRequirements from "@/components/OpportunityRequirements/OpportunityRequirements";
import ShortlistAction from "@/components/ShortlistAction/ShortlistAction";
import { loadOpportunityDetail } from "@/lib/api/detail.ts";
import { asApiFailure } from "@/lib/api/errors.ts";
import { serverApi } from "@/lib/api/server.ts";
import { parseOpportunityId } from "@/lib/contracts/endpoints.ts";
import {
  type DetailScreenProps,
  detailReturnHref,
} from "@/lib/queries/details.ts";

export default async function OpportunityDetailScreen({
  params,
  searchParams,
}: DetailScreenProps) {
  let id: number;
  try {
    id = parseOpportunityId((await params).id);
  } catch {
    notFound();
  }
  let result: Awaited<ReturnType<typeof loadOpportunityDetail>>;
  try {
    result = await loadOpportunityDetail(await serverApi(), id);
  } catch (error) {
    return <ApiFeedback reason={asApiFailure(error).reason} />;
  }
  if (result.opportunity.status === "rejected") {
    const error = asApiFailure(result.opportunity.reason);
    if (error.status === 404) notFound();
    return <ApiFeedback reason={error.reason} />;
  }
  const opportunity = result.opportunity.value;
  const backHref = detailReturnHref(await searchParams);
  return (
    <div className="space-y-8">
      <Link
        href={backHref}
        className="inline-block text-sm font-medium text-action underline underline-offset-4"
      >
        Back to results
      </Link>
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">{opportunity.title}</h1>
        <OpportunityMeta opportunity={opportunity} />
      </div>
      <ShortlistAction
        opportunityId={opportunity.id}
        initialSaved={opportunity.is_shortlisted}
      />
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">About the opportunity</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-7">
              {opportunity.description}
            </p>
          </section>
          <OpportunityRequirements opportunity={opportunity} />
        </div>
        <MatchPanel state={result.match} />
      </div>
    </div>
  );
}
