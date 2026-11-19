import { Button } from "flowbite-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState/EmptyState";
import type { CollectionRoute } from "@/lib/queries/navigation.ts";

export default function InvalidQueryState({ route }: { route: CollectionRoute }) {
  return <EmptyState title="These URL filters are invalid" description="Use supported filters once each, with valid values. Remove blank, duplicated or unknown query parameters before trying again." action={<Button as={Link} href={route}>Reset URL filters</Button>} />;
}
