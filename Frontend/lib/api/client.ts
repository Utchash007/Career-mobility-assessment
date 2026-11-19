import { z } from "zod";
import {
  API_PATHS,
  matchPath,
  opportunityPath,
  shortlistPath,
} from "../contracts/endpoints.ts";
import { matchPageSchema, matchResultSchema } from "../contracts/match.ts";
import { dataDeletionResponseSchema } from "../contracts/me.ts";
import {
  opportunityPageSchema,
  opportunityReadSchema,
} from "../contracts/opportunity.ts";
import {
  type ProfileWrite,
  profileReadSchema,
  profileWriteSchema,
} from "../contracts/profile.ts";
import {
  type ShortlistSave,
  shortlistItemSchema,
  shortlistNoteUpdateSchema,
  shortlistPageSchema,
  shortlistSaveSchema,
} from "../contracts/shortlist.ts";
import {
  type MatchQuery,
  type OpportunityQuery,
  type ShortlistQuery,
  serializeMatchQuery,
  serializeOpportunityQuery,
  serializeShortlistQuery,
} from "../queries/collections.ts";
import type { createTransport } from "./transport.ts";

export function createApiClient(request: ReturnType<typeof createTransport>) {
  return {
    getProfile: () =>
      request({
        method: "GET",
        path: API_PATHS.profile,
        statuses: [200],
        schema: profileReadSchema,
      }),
    saveProfile: (body: ProfileWrite) =>
      request({
        method: "PUT",
        path: API_PATHS.profile,
        body: profileWriteSchema.parse(body),
        statuses: [200, 201],
        schema: profileReadSchema,
      }),
    sampleProfile: () =>
      request({
        method: "POST",
        path: API_PATHS.sampleProfile,
        body: {},
        statuses: [200, 201],
        schema: profileReadSchema,
      }),
    getOpportunities: (query: OpportunityQuery) =>
      request({
        method: "GET",
        path: `${API_PATHS.opportunities}?${serializeOpportunityQuery(query)}`,
        statuses: [200],
        schema: opportunityPageSchema,
      }),
    getOpportunity: (id: number) =>
      request({
        method: "GET",
        path: opportunityPath(id),
        statuses: [200],
        schema: opportunityReadSchema,
      }),
    getMatches: (query: MatchQuery) =>
      request({
        method: "GET",
        path: `${API_PATHS.matches}?${serializeMatchQuery(query)}`,
        statuses: [200],
        schema: matchPageSchema,
      }),
    getMatch: (id: number) =>
      request({
        method: "GET",
        path: matchPath(id),
        statuses: [200],
        schema: matchResultSchema,
      }),
    getShortlist: (query: ShortlistQuery) =>
      request({
        method: "GET",
        path: `${API_PATHS.shortlist}?${serializeShortlistQuery(query)}`,
        statuses: [200],
        schema: shortlistPageSchema,
      }),
    saveShortlist: (id: number, body: ShortlistSave = {}) =>
      request({
        method: "POST",
        path: shortlistPath(id),
        body: shortlistSaveSchema.parse(body),
        statuses: [200, 201],
        schema: shortlistItemSchema,
      }),
    updateNote: (id: number, note: string) =>
      request({
        method: "PATCH",
        path: shortlistPath(id),
        body: shortlistNoteUpdateSchema.parse({ note }),
        statuses: [200],
        schema: shortlistItemSchema,
      }),
    removeShortlist: (id: number) =>
      request({
        method: "DELETE",
        path: shortlistPath(id),
        statuses: [204],
        schema: z.undefined(),
      }),
    deleteApplicationData: () =>
      request({
        method: "DELETE",
        path: API_PATHS.me,
        statuses: [200],
        schema: dataDeletionResponseSchema,
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
