import { Badge } from "flowbite-react";
import type { CriterionResult } from "@/lib/contracts/match.ts";
import {
  CRITERION_LABELS,
  CRITERION_STATUS_LABELS,
} from "@/lib/display/labels.ts";
import { criterionEvidence } from "@/lib/display/matches.ts";

export default function CriterionRow({
  criterion,
}: {
  criterion: CriterionResult;
}) {
  const evidence = criterionEvidence(criterion);
  return (
    <article className="space-y-3 rounded-xl border border-accent/25 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          {CRITERION_LABELS[criterion.key]}
        </h3>
        <Badge
          color={
            criterion.status === "met"
              ? "success"
              : criterion.status === "unmet"
                ? "failure"
                : criterion.status === "partial"
                  ? "warning"
                  : "info"
          }
        >
          {CRITERION_STATUS_LABELS[criterion.status]}
        </Badge>
      </div>
      <p className="text-sm">
        Criterion score:{" "}
        {criterion.score === null
          ? "Unknown"
          : `${criterion.score.toFixed(2)} / 1.00`}{" "}
        · Base weight: {(criterion.weight * 100).toFixed(0)}%
      </p>
      <p className="whitespace-pre-wrap text-sm leading-6">
        {criterion.reason}
      </p>
      {evidence.length > 0 ? (
        <dl className="space-y-2 text-sm">
          {evidence.map((line) => (
            <div key={line.label}>
              <dt className="font-medium">{line.label}</dt>
              <dd className="mt-1 break-words">{line.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs">
          No supported additional evidence is available. The backend reason
          remains authoritative.
        </p>
      )}
    </article>
  );
}
