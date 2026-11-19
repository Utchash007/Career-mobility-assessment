import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import EligibilityFlags from "@/components/EligibilityFlags/EligibilityFlags";
import MatchBreakdown from "@/components/MatchBreakdown/MatchBreakdown";
import MatchLabelBadge from "@/components/MatchLabelBadge/MatchLabelBadge";
import MatchScore from "@/components/MatchScore/MatchScore";
import type { DetailMatchState } from "@/lib/api/detail.ts";

export default function MatchPanel({ state }: { state: DetailMatchState }) {
  return (
    <section
      aria-label="Your fit for this opportunity"
      className="space-y-5 rounded-2xl border border-accent/25 bg-soft-accent/10 p-5 sm:p-7"
    >
      <h2 className="text-2xl font-semibold">Your fit</h2>
      {state.status === "profile_required" ? (
        <ApiFeedback reason="invalid_request" profileRequired />
      ) : state.status === "error" ? (
        <ApiFeedback reason={state.reason} />
      ) : (
        <>
          <MatchLabelBadge label={state.match.label} />
          <EligibilityFlags flags={state.match.flags} />
          <MatchScore
            score={state.match.overall_score}
            evaluated={state.match.criteria_evaluated}
          />
          <MatchBreakdown match={state.match} />
        </>
      )}
    </section>
  );
}
