"use client";

import { Button, Label, Select, TextInput } from "flowbite-react";
import { useState, type ReactNode } from "react";
import FieldFeedback from "@/components/FieldFeedback/FieldFeedback";
import { COUNTRY_CODES } from "@/lib/contracts/codes.ts";
import { OPPORTUNITY_TYPES, WORK_MODES, type OpportunityType, type WorkMode } from "@/lib/contracts/enums.ts";
import { countryLabel, OPPORTUNITY_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/display/labels.ts";
import type { CollectionFilterDraft, CollectionQuery } from "@/lib/queries/collections.ts";
import type { FieldErrors } from "@/lib/forms/errors.ts";

export default function CollectionFilters({ query, errors, onApply, children }: {
  query: CollectionQuery; errors: FieldErrors; onApply: (draft: CollectionFilterDraft) => void; children?: ReactNode;
}) {
  const [draft, setDraft] = useState<CollectionFilterDraft>(() => ({ q: query.q ?? "", country: query.country ?? "", type: query.type ?? "", work_mode: query.work_mode ?? "", page_size: String(query.page_size) }));
  return (
    <form onSubmit={(event) => { event.preventDefault(); onApply(draft); }} noValidate className="grid gap-4 rounded-2xl border border-accent/25 bg-soft-accent/10 p-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Collection filters">
      <div className="space-y-2"><Label htmlFor="filter-search">Search</Label><TextInput id="filter-search" value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} aria-describedby="filter-search-help" aria-invalid={Boolean(errors.q)} /><FieldFeedback id="filter-search-help" error={errors.q} hint="Title or organisation, up to 100 characters." /></div>
      <div className="space-y-2"><Label htmlFor="filter-country">Country</Label><Select id="filter-country" value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })}><option value="">All countries</option>{COUNTRY_CODES.map((code) => <option key={code} value={code}>{countryLabel(code)}</option>)}</Select></div>
      <div className="space-y-2"><Label htmlFor="filter-type">Type</Label><Select id="filter-type" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as OpportunityType | "" })}><option value="">All types</option>{OPPORTUNITY_TYPES.map((type) => <option key={type} value={type}>{OPPORTUNITY_TYPE_LABELS[type]}</option>)}</Select></div>
      <div className="space-y-2"><Label htmlFor="filter-mode">Work mode</Label><Select id="filter-mode" value={draft.work_mode} onChange={(event) => setDraft({ ...draft, work_mode: event.target.value as WorkMode | "" })}><option value="">All modes</option>{WORK_MODES.map((mode) => <option key={mode} value={mode}>{WORK_MODE_LABELS[mode]}</option>)}</Select></div>
      <div className="space-y-2"><Label htmlFor="filter-size">Results per page</Label><TextInput id="filter-size" inputMode="numeric" value={draft.page_size} onChange={(event) => setDraft({ ...draft, page_size: event.target.value })} aria-describedby="filter-size-help" aria-invalid={Boolean(errors.page_size)} /><FieldFeedback id="filter-size-help" error={errors.page_size} hint="1–100" /></div>
      {children}
      {Object.keys(errors).length > 0 ? <p role="alert" className="text-sm text-critical sm:col-span-2 lg:col-span-3">Review your filters; no new search has been applied.</p> : null}
      <div className="sm:col-span-2 lg:col-span-3"><Button type="submit">Apply filters</Button></div>
    </form>
  );
}
