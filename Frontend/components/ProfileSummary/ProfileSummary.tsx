import { Card } from "flowbite-react";
import LinkButton from "@/components/LinkButton/LinkButton";
import type { ProfileRead } from "@/lib/contracts/profile.ts";
import {
  EDUCATION_LABELS,
  keyLabel,
  WORK_AUTHORISATION_NOTICE,
} from "@/lib/display/labels.ts";

export default function ProfileSummary({
  profile,
}: {
  profile: Pick<
    ProfileRead,
    "full_name" | "education" | "experience_years" | "skills"
  >;
}) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">Profile for {profile.full_name}</h2>
      <p className="text-sm">
        {profile.education.level === null
          ? "Education unspecified"
          : EDUCATION_LABELS[profile.education.level]}{" "}
        ·{" "}
        {profile.experience_years === null
          ? "Experience unspecified"
          : `${profile.experience_years} years of experience`}
      </p>
      <p className="text-sm">
        {profile.skills.map(keyLabel).join(", ") || "No skills declared"}
      </p>
      <p className="text-xs">
        {WORK_AUTHORISATION_NOTICE}. The saved application name may be fictional
        sample content; it does not rename your Clerk identity.
      </p>
      <LinkButton href="/profile" color="alternative">
        Edit profile
      </LinkButton>
    </Card>
  );
}
