import { Card } from "flowbite-react";

export interface WorkflowPreviewCardProps {
  step: string;
  title: string;
  description: string;
}

export default function WorkflowPreviewCard({
  step,
  title,
  description,
}: WorkflowPreviewCardProps) {
  return (
    <Card role="article" aria-label={title} className="h-full">
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-soft-accent/40 text-sm font-semibold text-ink">
          {step}
        </span>
        <span className="text-xs font-medium text-action">
          Planned workflow
        </span>
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-ink">{title}</h3>
      <p className="text-sm leading-6 text-ink">{description}</p>
    </Card>
  );
}
