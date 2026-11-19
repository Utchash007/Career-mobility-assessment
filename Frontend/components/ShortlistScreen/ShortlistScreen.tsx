import { redirect } from "next/navigation";
import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import CollectionPagination from "@/components/CollectionPagination/CollectionPagination";
import EmptyState from "@/components/EmptyState/EmptyState";
import InvalidQueryState from "@/components/InvalidQueryState/InvalidQueryState";
import LinkButton from "@/components/LinkButton/LinkButton";
import ShortlistCard from "@/components/ShortlistCard/ShortlistCard";
import ShortlistFilters from "@/components/ShortlistFilters/ShortlistFilters";
import { asApiFailure, isMissingProfile } from "@/lib/api/errors.ts";
import { serverApi } from "@/lib/api/server.ts";
import type { Paginated } from "@/lib/contracts/common.ts";
import type { ShortlistItem } from "@/lib/contracts/shortlist.ts";
import {
  parseShortlistQuery,
  type ShortlistQuery,
  serializeShortlistQuery,
} from "@/lib/queries/collections.ts";
import {
  collectionHref,
  type ScreenSearchProps,
} from "@/lib/queries/navigation.ts";

export default async function ShortlistScreen({
  searchParams,
}: ScreenSearchProps) {
  let query: ShortlistQuery;
  try {
    query = parseShortlistQuery(await searchParams);
  } catch {
    return <InvalidQueryState route="/shortlist" />;
  }
  let result: Paginated<ShortlistItem>;
  try {
    result = await (await serverApi()).getShortlist(query);
  } catch (error) {
    return (
      <ApiFeedback
        reason={asApiFailure(error).reason}
        profileRequired={isMissingProfile(error)}
      />
    );
  }
  const serialized = serializeShortlistQuery(query).toString();
  const lastPage = Math.max(1, result.pagination.total_pages);
  if (query.page > lastPage)
    redirect(collectionHref("/shortlist", serialized, lastPage));
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Your shortlist</h1>
        <p className="text-sm">
          Saved opportunities and private notes belong to your application data,
          not your Clerk identity.
        </p>
      </div>
      <ShortlistFilters key={serialized} query={query} />
      <p className="text-sm">
        {result.pagination.total} saved opportunities for these filters
      </p>
      {result.items.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {result.items.map((item) => (
            <ShortlistCard
              key={item.opportunity_id}
              item={item}
              context={{ route: "/shortlist", query: serialized }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved opportunities for these filters"
          description="Broaden filters or explore opportunities to save your next steps."
          action={
            <LinkButton href="/opportunities">Explore opportunities</LinkButton>
          }
        />
      )}
      <CollectionPagination
        pagination={result.pagination}
        route="/shortlist"
        query={serialized}
      />
    </div>
  );
}
