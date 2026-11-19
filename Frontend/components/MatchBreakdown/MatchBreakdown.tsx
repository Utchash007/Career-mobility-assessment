import CriterionRow from "@/components/CriterionRow/CriterionRow";
import type { MatchResult } from "@/lib/contracts/match.ts";

export default function MatchBreakdown({ match }: { match: MatchResult }) {
  return (
    <section aria-label="Full match breakdown" className="space-y-4">
      <h2 className="text-xl font-semibold">Match breakdown</h2>
      <p className="text-sm">
        {match.criteria_evaluated} of {match.criteria_total} criteria evaluated
        · matcher {match.matcher_version}. Unknown criteria are distinct from
        unmet requirements; the backend handles weighting.
      </p>
      {match.criteria.map((criterion) => (
        <CriterionRow key={criterion.key} criterion={criterion} />
      ))}
    </section>
  );
}
