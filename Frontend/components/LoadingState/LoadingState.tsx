import { Spinner } from "flowbite-react";

export interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex min-h-40 items-center justify-center gap-4 rounded-2xl border border-accent/25 bg-canvas p-6"
    >
      <Spinner size="lg" role="presentation" aria-hidden="true" />
      <p className="text-sm font-medium text-ink">{label}</p>
    </div>
  );
}
