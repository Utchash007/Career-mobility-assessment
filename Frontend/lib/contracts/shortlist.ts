import { z } from "zod";
import {
  characterCount,
  paginatedSchema,
  positiveIdSchema,
  timestampSchema,
} from "./common.ts";
import {
  type OpportunitySummary,
  opportunitySummarySchema,
} from "./opportunity.ts";

export interface ShortlistSave {
  note?: string;
}

export interface ShortlistNoteUpdate {
  note: string;
}

export interface ShortlistItem {
  opportunity_id: number;
  opportunity: OpportunitySummary;
  note: string;
  created_at: string;
  updated_at: string;
}

// No trimming: an explicit empty string clears; omission preserves the old note.
export const noteSchema = z
  .string()
  .refine((value) => characterCount(value) <= 500, "Use at most 500 characters.");

export const shortlistSaveSchema = z.strictObject({
  note: noteSchema.optional(),
}) satisfies z.ZodType<ShortlistSave>;

export const shortlistNoteUpdateSchema = z.strictObject({
  note: noteSchema,
}) satisfies z.ZodType<ShortlistNoteUpdate>;

export const shortlistItemSchema = z
  .strictObject({
    opportunity_id: positiveIdSchema,
    opportunity: opportunitySummarySchema,
    note: noteSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .superRefine((value, context) => {
    if (
      value.opportunity.id !== value.opportunity_id ||
      !value.opportunity.is_shortlisted
    ) {
      context.addIssue({
        code: "custom",
        path: ["opportunity"],
        message: "Saved opportunity state is inconsistent. Refresh to try again.",
      });
    }
  }) satisfies z.ZodType<ShortlistItem>;

export const shortlistPageSchema = paginatedSchema(shortlistItemSchema);
