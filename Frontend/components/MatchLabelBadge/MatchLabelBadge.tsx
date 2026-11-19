import { Badge } from "flowbite-react";
import type { MatchLabel } from "@/lib/contracts/enums.ts";
import { MATCH_LABEL_TEXT } from "@/lib/display/labels.ts";

const colors = {
  strong: "success",
  partial: "warning",
  weak: "gray",
  not_recommended: "failure",
  insufficient_data: "info",
} as const;

export default function MatchLabelBadge({ label }: { label: MatchLabel }) {
  return <Badge color={colors[label]}>{MATCH_LABEL_TEXT[label]}</Badge>;
}
