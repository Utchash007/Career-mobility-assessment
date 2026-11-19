"use client";

import { createContext } from "react";
import type { ApiClient } from "../api/client.ts";

export interface SessionApi extends ApiClient {
  isCurrent: () => boolean;
}

export const SessionApiContext = createContext<SessionApi | null>(null);
