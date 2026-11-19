import {
  parseMatchQuery,
  parseOpportunityQuery,
  parseShortlistQuery,
} from "../queries/collections.ts";
import { ApiFailure } from "./errors.ts";

export type ApiMethod = "GET" | "PUT" | "POST" | "PATCH" | "DELETE";

export function parseApiBase(value: string | undefined): URL {
  try {
    if (!value || value !== value.trim()) throw new Error();
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !(url.protocol === "http:" && local)) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      throw new Error();
    return url;
  } catch {
    throw new ApiFailure("configuration");
  }
}

export function apiDestination(
  base: URL,
  method: ApiMethod,
  path: string,
): URL {
  if (
    !/^\/api\/v1\/[a-z]+(?:\/(?:sample|[1-9][0-9]*))?(?:\?[^#]*)?$/.test(path)
  ) {
    throw new ApiFailure("invalid_request");
  }
  const url = new URL(path, base);
  if (url.origin !== base.origin || url.hash)
    throw new ApiFailure("invalid_request");
  const route = url.pathname;
  const item =
    /^\/api\/v1\/(opportunities|matches|shortlist)\/([1-9][0-9]*)$/.exec(route);
  if (item && !Number.isSafeInteger(Number(item[2])))
    throw new ApiFailure("invalid_request");
  const allowed =
    (route === "/api/v1/profile" && ["GET", "PUT"].includes(method)) ||
    (route === "/api/v1/profile/sample" && method === "POST") ||
    (["/api/v1/opportunities", "/api/v1/matches", "/api/v1/shortlist"].includes(
      route,
    ) &&
      method === "GET") ||
    (route === "/api/v1/me" && method === "DELETE") ||
    (item &&
      (item[1] === "shortlist"
        ? ["POST", "PATCH", "DELETE"].includes(method)
        : method === "GET"));
  if (!allowed) throw new ApiFailure("invalid_request");
  try {
    if (url.search) {
      if (method !== "GET" || item) throw new Error();
      if (route === "/api/v1/opportunities")
        parseOpportunityQuery(url.searchParams);
      else if (route === "/api/v1/matches") parseMatchQuery(url.searchParams);
      else if (route === "/api/v1/shortlist")
        parseShortlistQuery(url.searchParams);
      else throw new Error();
    }
  } catch {
    throw new ApiFailure("invalid_request");
  }
  return url;
}
