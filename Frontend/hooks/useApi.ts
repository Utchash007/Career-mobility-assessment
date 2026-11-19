"use client";

import { use } from "react";
import { SessionApiContext } from "../lib/session/context.ts";

export function useApi() {
  const api = use(SessionApiContext);
  if (!api) throw new Error("An active session boundary is required.");
  return api;
}
