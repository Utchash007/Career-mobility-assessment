import { z } from "zod";

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface HealthResponse {
  status: "ok";
}

// Count Unicode characters like Pydantic/Postgres, not UTF-16 code units.
export function characterCount(value: string): number {
  return Array.from(value).length;
}

export function textSchema(maxLength?: number) {
  return z
    .string()
    .trim()
    .min(1, "Enter a text value.")
    .refine(
      (value) => maxLength === undefined || characterCount(value) <= maxLength,
      `Use no more than ${maxLength ?? "the allowed number of"} characters.`,
    );
}

export const positiveIdSchema = z.number().int().positive().safe();
export const timestampSchema = z.iso.datetime({ offset: true });
export const emptyObjectSchema = z.strictObject({});

export const paginationSchema = z.strictObject({
  page: positiveIdSchema,
  page_size: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative().safe(),
  total_pages: z.number().int().nonnegative().safe(),
  has_next: z.boolean(),
  has_previous: z.boolean(),
}) satisfies z.ZodType<Pagination>;

export function paginatedSchema<T extends z.ZodType>(itemSchema: T) {
  return z
    .strictObject({
      items: z.array(itemSchema),
      pagination: paginationSchema,
    })
    .superRefine(({ items, pagination }, context) => {
      const pages = Math.ceil(pagination.total / pagination.page_size);
      if (
        pagination.total_pages !== pages ||
        pagination.has_next !== pagination.page < pages ||
        pagination.has_previous !==
          (pagination.page > 1 && pagination.page <= pages) ||
        items.length > pagination.page_size ||
        items.length > pagination.total ||
        (pagination.page > pages && items.length > 0)
      ) {
        context.addIssue({
          code: "custom",
          path: ["pagination"],
          message: "Collection metadata is inconsistent. Refresh to try again.",
        });
      }
    });
}

// Open string codes let the UI safely handle future backend error codes.
export const apiErrorBodySchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  fields: z.record(z.string(), z.string()).optional(),
}) satisfies z.ZodType<ApiErrorBody>;

export const healthResponseSchema = z.strictObject({
  status: z.literal("ok"),
}) satisfies z.ZodType<HealthResponse>;
