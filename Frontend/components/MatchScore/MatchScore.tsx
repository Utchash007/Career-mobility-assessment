import { Progress } from "flowbite-react";
import { scoreText } from "@/lib/display/matches.ts";

export default function MatchScore({
  score,
  evaluated,
}: {
  score: number | null;
  evaluated: number;
}) {
  return (
    <div className="space-y-3">
      <p className="text-2xl font-semibold">{scoreText(score)}</p>
      {score !== null ? (
        <Progress
          progress={score}
          color="blue"
          aria-label="Backend fit score, out of 100"
          aria-valuemin={0}
          aria-valuemax={100}
        />
      ) : null}
      <p className="text-sm">
        Based on {evaluated} of 5 criteria. Fit is not a probability of legal
        eligibility or an employment guarantee.
      </p>
    </div>
  );
}
