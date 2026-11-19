import { z } from "zod";

export interface DataDeletionResponse {
  scope: "application_data";
  profile_deleted: boolean;
  shortlist_deleted: number;
  clerk_account_deleted: false;
}

export const dataDeletionResponseSchema = z.strictObject({
  scope: z.literal("application_data"),
  profile_deleted: z.boolean(),
  shortlist_deleted: z.number().int().nonnegative().safe(),
  clerk_account_deleted: z.literal(false),
}) satisfies z.ZodType<DataDeletionResponse>;
