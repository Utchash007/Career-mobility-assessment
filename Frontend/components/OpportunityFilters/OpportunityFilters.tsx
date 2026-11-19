"use client";

import { Label, Select } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import CollectionFilters from "@/components/CollectionFilters/CollectionFilters";
import { type FieldErrors, validationFieldErrors } from "@/lib/forms/errors.ts";
import { applyOpportunityFilters, type OpportunityQuery, type OpportunitySort, OPPORTUNITY_SORTS } from "@/lib/queries/collections.ts";

export default function OpportunityFilters({ query }: { query: OpportunityQuery }) {
  const router = useRouter();
  const [sort, setSort] = useState(query.sort);
  const [errors, setErrors] = useState<FieldErrors>({});
  return (
    <CollectionFilters query={query} errors={errors} onApply={(draft) => {
      try { router.push(`/opportunities?${applyOpportunityFilters({ ...draft, sort })}`); setErrors({}); }
      catch (error) { setErrors(error instanceof z.ZodError ? validationFieldErrors(error) : { body: "Review the filters." }); }
    }}>
      <div className="space-y-2"><Label htmlFor="filter-sort">Sort</Label><Select id="filter-sort" value={sort} onChange={(event) => setSort(event.target.value as OpportunitySort)}>{OPPORTUNITY_SORTS.map((value) => <option key={value} value={value}>{value === "id_asc" ? "Catalog order" : value === "title_asc" ? "Title A–Z" : "Title Z–A"}</option>)}</Select></div>
    </CollectionFilters>
  );
}
