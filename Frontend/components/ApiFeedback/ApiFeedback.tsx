import ConfigurationNotice from "@/components/ConfigurationNotice/ConfigurationNotice";
import ErrorState from "@/components/ErrorState/ErrorState";
import LinkButton from "@/components/LinkButton/LinkButton";
import ProfileRequiredState from "@/components/ProfileRequiredState/ProfileRequiredState";
import SessionRecovery from "@/components/SessionRecovery/SessionRecovery";
import type { FailureReason } from "@/lib/api/errors.ts";

export default function ApiFeedback({
  reason,
  profileRequired = false,
}: {
  reason: FailureReason;
  profileRequired?: boolean;
}) {
  if (profileRequired)
    return (
      <ProfileRequiredState
        action={<LinkButton href="/profile">Create your profile</LinkButton>}
      />
    );
  if (reason === "configuration") return <ConfigurationNotice kind="api" />;
  if (reason === "session_expired") return <SessionRecovery />;
  return (
    <ErrorState reason={reason === "cancelled" ? "session_expired" : reason} />
  );
}
