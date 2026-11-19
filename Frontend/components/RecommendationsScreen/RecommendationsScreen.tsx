import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import CollectionPagination from "@/components/CollectionPagination/CollectionPagination";
import EmptyState from "@/components/EmptyState/EmptyState";
import InvalidQueryState from "@/components/InvalidQueryState/InvalidQueryState";
import LinkButton from "@/components/LinkButton/LinkButton";
import MatchFilters from "@/components/MatchFilters/MatchFilters";
import RecommendationCard from "@/components/RecommendationCard/RecommendationCard";
import ShortlistAction from "@/components/ShortlistAction/ShortlistAction";
import { asApiFailure, isMissingProfile } from "@/lib/api/errors.ts";
import { serverApi } from "@/lib/api/server.ts";
import type { Paginated } from "@/lib/contracts/common.ts";
import type { MatchListItem } from "@/lib/contracts/match.ts";
import {
  type MatchQuery,
  parseMatchQuery,
  serializeMatchQuery,
} from "@/lib/queries/collections.ts";
import type { ScreenSearchProps } from "@/lib/queries/navigation.ts";

export default async function RecommendationsScreen({
  searchParams,
}: ScreenSearchProps) {
  let query: MatchQuery;
  try {
    query = parseMatchQuery(await searchParams);
  } catch {
    return <InvalidQueryState route="/recommendations" />;
  }
  let result: Paginated<MatchListItem>;
  try {
    result = await (await serverApi()).getMatches(query);
  } catch (error) {
    return (
      <ApiFeedback
        reason={asApiFailure(error).reason}
        profileRequired={isMissingProfile(error)}
      />
    );
  }
  const serialized = serializeMatchQuery(query).toString();
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Your matches</h1>
        <p className="text-sm leading-6">
          Ranked and explained by the backend. Eligibility findings remain
          visible even when fit is high.
        </p>
      </div>
      <MatchFilters key={serialized} query={query} />
      <p className="text-sm">
        {result.pagination.total} matching opportunities · returned ranking is
        preserved
      </p>
      {result.items.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {result.items.map((item) => (
            <RecommendationCard
              key={item.opportunity.id}
              item={item}
              context={{ route: "/recommendations", query: serialized }}
            >
              <ShortlistAction
                opportunityId={item.opportunity.id}
                initialSaved={item.opportunity.is_shortlisted}
              />
            </RecommendationCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            query.page > result.pagination.total_pages &&
            result.pagination.total > 0
              ? "This page is beyond the results"
              : "No matches for these filters"
          }
          description="Broaden filters or return to an available page. No scores or results have been invented."
          action={
            <LinkButton href="/recommendations">Reset match filters</LinkButton>
          }
        />
      )}
      <CollectionPagination
        pagination={result.pagination}
        route="/recommendations"
        query={serialized}
      />
    </div>
  );
}
