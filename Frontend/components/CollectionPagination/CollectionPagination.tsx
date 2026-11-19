"use client";

import { Button, Pagination } from "flowbite-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Pagination as PageMetadata } from "@/lib/contracts/common.ts";
import { collectionHref, type CollectionRoute } from "@/lib/queries/navigation.ts";

export default function CollectionPagination({ pagination, route, query }: { pagination: PageMetadata; route: CollectionRoute; query: string }) {
  const router = useRouter();
  if (pagination.total_pages === 0) return <p className="text-sm">0 results</p>;
  if (pagination.page > pagination.total_pages) return <Button as={Link} color="alternative" href={collectionHref(route, query, pagination.total_pages)}>Go to last available page</Button>;
  return (
    <nav aria-label="Results pages" className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm">Page {pagination.page} of {pagination.total_pages} · {pagination.total} results</p>
      <Pagination currentPage={pagination.page} totalPages={pagination.total_pages} onPageChange={(page) => router.push(collectionHref(route, query, page))} layout="navigation" />
    </nav>
  );
}
