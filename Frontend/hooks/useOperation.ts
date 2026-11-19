"use client";

import { useEffect, useRef, useState } from "react";
import { useApi } from "./useApi";
import { asApiFailure, type ApiFailure } from "../lib/api/errors.ts";

// A synchronous guard prevents double submissions before React commits pending UI.
export function useOperation() {
  const api = useApi();
  const busy = useRef(false);
  const mounted = useRef(true);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  async function run<T>(request: () => Promise<T>, success: (value: T) => void, failure: (error: ApiFailure) => void) {
    if (busy.current || !api.isCurrent() || !mounted.current) return;
    busy.current = true;
    setPending(true);
    try {
      const value = await request();
      if (mounted.current && api.isCurrent()) success(value);
    } catch (error) {
      if (mounted.current && api.isCurrent()) failure(asApiFailure(error));
    } finally {
      busy.current = false;
      if (mounted.current && api.isCurrent()) setPending(false);
    }
  }
  return { pending, run };
}
