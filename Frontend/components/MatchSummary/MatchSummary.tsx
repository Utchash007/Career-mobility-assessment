import type { MatchResult } from "@/lib/contracts/match.ts";
import { CRITERION_LABELS } from "@/lib/display/labels.ts";
import { matchReasons } from "@/lib/display/matches.ts";

export default function MatchSummary({ match }: { match: MatchResult }) {
  const reasons = matchReasons(match);
  return (
    <div className="space-y-4 text-sm">
      {(
        [
          ["Strengths", reasons.strengths],
          ["Gaps and partial fit", reasons.gaps],
          ["Needs more information", reasons.unknown],
        ] as const
      ).map(([title, criteria]) =>
        criteria.length > 0 ? (
          <section key={title} aria-label={title}>
            <h3 className="font-semibold">{title}</h3>
            <ul className="mt-2 list-inside list-disc space-y-2">
              {criteria.map((criterion) => (
                <li key={criterion.key}>
                  <span className="font-medium">
                    {CRITERION_LABELS[criterion.key]}:{" "}
                  </span>
                  {criterion.reason}
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}
