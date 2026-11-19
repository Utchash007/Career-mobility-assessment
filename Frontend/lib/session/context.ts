"use client";

import { createContext } from "react";
import type { ApiClient } from "../api/client.ts";
import type { createWriteCoordinator } from "./writes.ts";

export interface SessionApi extends ApiClient {
  isCurrent: () => boolean;
  writes: ReturnType<typeof createWriteCoordinator>;
}

export const SessionApiContext = createContext<SessionApi | null>(null);
