"use client";

import ErrorState from "@/components/ErrorState/ErrorState";

export default function Error({ retry }: { retry: () => void }) {
  return <ErrorState reason="unexpected" onRetry={retry} />;
}
