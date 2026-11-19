import { Card } from "flowbite-react";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card role="region" aria-label={title} className="w-full">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="max-w-2xl text-sm leading-6 text-ink">{description}</p>
      {action ? <div className="flex flex-wrap gap-3 pt-2">{action}</div> : null}
    </Card>
  );
}
