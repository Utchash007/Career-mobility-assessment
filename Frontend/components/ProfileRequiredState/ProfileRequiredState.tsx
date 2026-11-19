import type { ReactNode } from "react";
import EmptyState from "@/components/EmptyState/EmptyState";

export interface ProfileRequiredStateProps {
  action?: ReactNode;
}

export default function ProfileRequiredState({ action }: ProfileRequiredStateProps) {
  return (
    <EmptyState
      title="A profile is required"
      description="Create and save your profile before viewing personalized matches or saving opportunities. A missing profile is different from a search with no results."
      action={action}
    />
  );
}
