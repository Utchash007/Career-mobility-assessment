import EmptyState from "@/components/EmptyState/EmptyState";
import LinkButton from "@/components/LinkButton/LinkButton";
import type { CollectionRoute } from "@/lib/queries/navigation.ts";

export default function InvalidQueryState({
  route,
}: {
  route: CollectionRoute;
}) {
  return (
    <EmptyState
      title="These URL filters are invalid"
      description="Use supported filters once each, with valid values. Remove blank, duplicated or unknown query parameters before trying again."
      action={<LinkButton href={route}>Reset URL filters</LinkButton>}
    />
  );
}
