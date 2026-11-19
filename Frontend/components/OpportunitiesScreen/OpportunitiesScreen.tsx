import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import CollectionPagination from "@/components/CollectionPagination/CollectionPagination";
import EmptyState from "@/components/EmptyState/EmptyState";
import InvalidQueryState from "@/components/InvalidQueryState/InvalidQueryState";
import LinkButton from "@/components/LinkButton/LinkButton";
import OpportunityCard from "@/components/OpportunityCard/OpportunityCard";
import OpportunityFilters from "@/components/OpportunityFilters/OpportunityFilters";
import ShortlistAction from "@/components/ShortlistAction/ShortlistAction";
import { asApiFailure } from "@/lib/api/errors.ts";
import { serverApi } from "@/lib/api/server.ts";
import type { Paginated } from "@/lib/contracts/common.ts";
import type { OpportunitySummary } from "@/lib/contracts/opportunity.ts";
import {
  type OpportunityQuery,
  parseOpportunityQuery,
  serializeOpportunityQuery,
} from "@/lib/queries/collections.ts";
import type { ScreenSearchProps } from "@/lib/queries/navigation.ts";

export default async function OpportunitiesScreen({
  searchParams,
}: ScreenSearchProps) {
  let query: OpportunityQuery;
  try {
    query = parseOpportunityQuery(await searchParams);
  } catch {
    return <InvalidQueryState route="/opportunities" />;
  }
  const serialized = serializeOpportunityQuery(query).toString();
  let result: Paginated<OpportunitySummary>;
  try {
    result = await (await serverApi()).getOpportunities(query);
  } catch (error) {
    return <ApiFeedback reason={asApiFailure(error).reason} />;
  }
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Explore opportunities</h1>
        <p className="text-sm">
          Browse without a saved profile. Results, filters and totals come from
          the backend.
        </p>
      </div>
      <OpportunityFilters key={serialized} query={query} />
      <p className="text-sm">
        {result.pagination.total} matching opportunities
      </p>
      {result.items.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {result.items.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              context={{ route: "/opportunities", query: serialized }}
            >
              <ShortlistAction
                opportunityId={opportunity.id}
                initialSaved={opportunity.is_shortlisted}
              />
            </OpportunityCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            query.page > result.pagination.total_pages &&
            result.pagination.total > 0
              ? "This page is beyond the results"
              : "No opportunities match these filters"
          }
          description="Try a valid earlier page or broaden your search. This is a successful empty result, not a service failure."
          action={<LinkButton href="/opportunities">Reset filters</LinkButton>}
        />
      )}
      <CollectionPagination
        pagination={result.pagination}
        route="/opportunities"
        query={serialized}
      />
    </div>
  );
}
