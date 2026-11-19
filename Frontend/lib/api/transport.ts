import type { z } from "zod";
import { apiErrorBodySchema } from "../contracts/common.ts";
import type { FieldErrors } from "../forms/errors.ts";
import { type ApiMethod, apiDestination, parseApiBase } from "./destination.ts";
import { ApiFailure } from "./errors.ts";

export interface ApiRequest<T> {
  method: ApiMethod;
  path: string;
  statuses: readonly number[];
  schema: z.ZodType<T>;
  body?: unknown;
}

export interface TransportOptions {
  baseUrl: string | undefined;
  getToken: () => Promise<string | null>;
  isCurrent?: () => boolean;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export function createTransport(options: TransportOptions) {
  return async function request<T>(
    spec: ApiRequest<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    const destination = apiDestination(
      parseApiBase(options.baseUrl),
      spec.method,
      spec.path,
    );
    const mutation = spec.method !== "GET";
    if (
      (spec.method === "GET" || spec.method === "DELETE") &&
      spec.body !== undefined
    ) {
      throw new ApiFailure("invalid_request");
    }
    const timeout = AbortSignal.timeout(
      Math.min(60_000, Math.max(1, options.timeoutMs ?? 15_000)),
    );
    const signals = [timeout, options.signal, signal].filter(
      (value): value is AbortSignal => value !== undefined,
    );
    const combined = AbortSignal.any(signals);
    const current = () => !combined.aborted && (options.isCurrent?.() ?? true);
    const assertCurrent = () => {
      if (!current()) throw new ApiFailure("cancelled");
    };
    let sent = false;
    try {
      assertCurrent();
      const token = await new Promise<string | null>((resolve, reject) => {
        const abort = () => reject(new ApiFailure("cancelled"));
        combined.addEventListener("abort", abort, { once: true });
        Promise.resolve()
          .then(options.getToken)
          .then(resolve, () => reject(new ApiFailure("session_expired")))
          .finally(() => combined.removeEventListener("abort", abort));
      });
      assertCurrent();
      if (!token) throw new ApiFailure("session_expired", 401);
      const headers = new Headers({
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      });
      if (spec.body !== undefined)
        headers.set("Content-Type", "application/json");
      sent = true;
      const response = await (options.fetcher ?? fetch)(destination, {
        method: spec.method,
        headers,
        body: spec.body === undefined ? undefined : JSON.stringify(spec.body),
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal: combined,
      });
      assertCurrent();
      if (!response.ok) {
        let code = "";
        const fields: FieldErrors = Object.create(null);
        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          const parsed = apiErrorBodySchema.safeParse(
            await response.json().catch(() => null),
          );
          if (parsed.success) {
            code = parsed.data.code;
            for (const name of Object.keys(parsed.data.fields ?? {})) {
              if (/^[a-z_]+(?:\.(?:[a-z_]+|[0-9]+))*$/.test(name))
                fields[name] = "Review this value.";
            }
          }
        }
        assertCurrent();
        const reason =
          response.status === 401
            ? "session_expired"
            : response.status === 503
              ? "unavailable"
              : response.status === 404
                ? "not_found"
                : [400, 403, 409, 422].includes(response.status)
                  ? "invalid_request"
                  : "unexpected";
        throw new ApiFailure(
          reason,
          response.status,
          code,
          fields,
          mutation && response.status >= 500,
        );
      }
      if (!spec.statuses.includes(response.status))
        throw new ApiFailure("unexpected", response.status, "", {}, mutation);
      if (response.status === 204) return undefined as T;
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new ApiFailure("unexpected", response.status, "", {}, mutation);
      }
      const parsed = spec.schema.safeParse(await response.json());
      assertCurrent();
      if (!parsed.success)
        throw new ApiFailure("unexpected", response.status, "", {}, mutation);
      return parsed.data;
    } catch (error) {
      if (
        options.signal?.aborted ||
        signal?.aborted ||
        !(options.isCurrent?.() ?? true)
      ) {
        throw new ApiFailure("cancelled", 0, "", {}, sent && mutation);
      }
      if (timeout.aborted)
        throw new ApiFailure("network", 0, "", {}, sent && mutation);
      if (error instanceof ApiFailure) throw error;
      throw new ApiFailure("network", 0, "", {}, sent && mutation);
    }
  };
}
