import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { createApiClient } from "../lib/api/client.ts";
import { apiDestination, parseApiBase } from "../lib/api/destination.ts";
import { ApiFailure } from "../lib/api/errors.ts";
import { createTransport } from "../lib/api/transport.ts";

const baseUrl = "http://127.0.0.1:8000";
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const spec = {
  method: "GET",
  path: "/api/v1/profile",
  statuses: [200],
  schema: z.strictObject({ ok: z.boolean() }),
};
const token = "fictional-session-token";

test("API configuration rejects credentials, paths, queries and insecure nonlocal hosts", () => {
  for (const value of [
    undefined,
    "",
    " https://api.example.test",
    "http://api.example.test",
    "https://user:pass@example.test",
    "https://api.example.test/api",
    "https://api.example.test/?q=x",
    "https://api.example.test/#x",
  ]) {
    assert.throws(
      () => parseApiBase(value),
      (error) => error.reason === "configuration",
    );
  }
  assert.equal(parseApiBase(baseUrl).origin, baseUrl);
  assert.equal(
    parseApiBase("https://api.example.test/").origin,
    "https://api.example.test",
  );
});

test("only supported methods and relative endpoints accept session credentials", () => {
  const base = parseApiBase(baseUrl);
  for (const path of [
    "https://other.test/api/v1/profile",
    "//other.test/api/v1/profile",
    "/api/v1/../me",
    "/api/v1/opportunities/0",
    "/api/v1/opportunities/9007199254740992",
    "/api/v1/profile?user_id=x",
    "/api/v1/matches?sort=id_asc",
    "/api/v1/opportunities?page=1&page=2",
    "/api/v1/me#x",
  ]) {
    assert.throws(() => apiDestination(base, "GET", path), ApiFailure);
  }
  assert.throws(
    () => apiDestination(base, "POST", "/api/v1/opportunities"),
    ApiFailure,
  );
  assert.equal(
    apiDestination(base, "GET", "/api/v1/opportunities?page=1&page_size=10")
      .origin,
    base.origin,
  );
});

test("tokens are obtained per request and private fetch defaults prevent forwarding", async () => {
  let tokens = 0;
  const request = createTransport({
    baseUrl,
    getToken: async () => {
      tokens++;
      return token;
    },
    fetcher: async (url, init) => {
      assert.equal(url.origin, baseUrl);
      assert.equal(init.headers.get("Authorization"), `Bearer ${token}`);
      assert.equal(init.cache, "no-store");
      assert.equal(init.redirect, "error");
      assert.equal(init.credentials, "omit");
      return json({ ok: true });
    },
  });
  assert.deepEqual(await request(spec), { ok: true });
  await request(spec);
  assert.equal(tokens, 2);
});

test("missing configuration or token prevents the fetch", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return json({ ok: true });
  };
  await assert.rejects(
    createTransport({
      baseUrl: undefined,
      getToken: async () => token,
      fetcher,
    })(spec),
    (error) => error.reason === "configuration",
  );
  await assert.rejects(
    createTransport({ baseUrl, getToken: async () => null, fetcher })(spec),
    (error) => error.reason === "session_expired",
  );
  assert.equal(calls, 0);
});

test("204 deletes skip JSON parsing and send no body", async () => {
  const api = createApiClient(
    createTransport({
      baseUrl,
      getToken: async () => token,
      fetcher: async (_url, init) => {
        assert.equal(init.method, "DELETE");
        assert.equal(init.body, undefined);
        const response = new Response(null, { status: 204 });
        response.json = () => {
          throw new Error("Must not parse an empty response");
        };
        return response;
      },
    }),
  );
  assert.equal(await api.removeShortlist(1), undefined);
});

test("HTTP failures retain safe paths/codes, not provider message text", async () => {
  const request = createTransport({
    baseUrl,
    getToken: async () => token,
    fetcher: async () =>
      json(
        {
          code: "VALIDATION_ERROR",
          message: "private text",
          fields: { "languages.1.level": "private input" },
        },
        422,
      ),
  });
  await assert.rejects(request(spec), (error) => {
    assert.equal(error.status, 422);
    assert.equal(error.fields["languages.1.level"], "Review this value.");
    assert.doesNotMatch(JSON.stringify(error), /private/);
    return true;
  });
});

test("401 has no automatic retry and 503 is unavailable, never empty success", async () => {
  for (const [status, reason] of [
    [401, "session_expired"],
    [503, "unavailable"],
  ]) {
    let calls = 0;
    const request = createTransport({
      baseUrl,
      getToken: async () => token,
      fetcher: async () => {
        calls++;
        return new Response("upstream failure", { status });
      },
    });
    await assert.rejects(request(spec), (error) => error.reason === reason);
    assert.equal(calls, 1);
  }
});

test("non-JSON/invalid success and ambiguous mutation outcomes are not confirmed", async () => {
  for (const response of [
    new Response("html", { status: 200 }),
    json({ wrong: true }),
  ]) {
    await assert.rejects(
      createTransport({
        baseUrl,
        getToken: async () => token,
        fetcher: async () => response,
      })(spec),
      (error) => error.reason === "unexpected",
    );
  }
  await assert.rejects(
    createTransport({
      baseUrl,
      getToken: async () => token,
      fetcher: async () => {
        throw new Error("connection lost");
      },
    })({ ...spec, method: "PUT", body: {} }),
    (error) => error.unconfirmed === true,
  );
});

test("late responses after a session change are discarded", async () => {
  let active = true;
  const request = createTransport({
    baseUrl,
    getToken: async () => token,
    isCurrent: () => active,
    fetcher: async () => {
      active = false;
      return json({ ok: true });
    },
  });
  await assert.rejects(request(spec), (error) => error.reason === "cancelled");
});
