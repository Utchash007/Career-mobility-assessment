"use client";

import { Label, Select } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import CollectionFilters from "@/components/CollectionFilters/CollectionFilters";
import { type FieldErrors, validationFieldErrors } from "@/lib/forms/errors.ts";
import { applyShortlistFilters, type ShortlistQuery, type ShortlistSort, SHORTLIST_SORTS } from "@/lib/queries/collections.ts";

export default function ShortlistFilters({ query }: { query: ShortlistQuery }) {
  const router = useRouter();
  const [sort, setSort] = useState(query.sort);
  const [errors, setErrors] = useState<FieldErrors>({});
  return (
    <CollectionFilters query={query} errors={errors} onApply={(draft) => {
      try { router.push(`/shortlist?${applyShortlistFilters({ ...draft, sort })}`); setErrors({}); }
      catch (error) { setErrors(error instanceof z.ZodError ? validationFieldErrors(error) : { body: "Review the filters." }); }
    }}>
      <div className="space-y-2"><Label htmlFor="filter-sort">Sort saved opportunities</Label><Select id="filter-sort" value={sort} onChange={(event) => setSort(event.target.value as ShortlistSort)}>{SHORTLIST_SORTS.map((value) => <option key={value} value={value}>{value === "created_at_desc" ? "Most recently saved" : value === "created_at_asc" ? "Oldest saved first" : "Title A–Z"}</option>)}</Select></div>
    </CollectionFilters>
  );
}
