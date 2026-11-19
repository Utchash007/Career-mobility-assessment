import { Alert } from "flowbite-react";
import type { OpportunitySummary } from "@/lib/contracts/opportunity.ts";
import {
  countryLabel,
  EDUCATION_LABELS,
  keyLabel,
  LANGUAGE_LEVEL_LABELS,
  languageLabel,
} from "@/lib/display/labels.ts";

export default function OpportunityRequirements({
  opportunity,
}: {
  opportunity: OpportunitySummary;
}) {
  return (
    <section aria-label="Opportunity requirements" className="space-y-6">
      <h2 className="text-2xl font-semibold">Requirements</h2>
      <dl className="space-y-4 text-sm leading-6">
        <div>
          <dt className="font-semibold">Required skills</dt>
          <dd>
            {opportunity.required_skills.map(keyLabel).join(", ") ||
              "None specified"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Preferred skills</dt>
          <dd>
            {opportunity.preferred_skills.map(keyLabel).join(", ") ||
              "None specified"}
          </dd>
        </div>
        {(["required", "preferred"] as const).map((kind) => {
          const requirement = opportunity.education_requirements[kind];
          return (
            <div key={kind}>
              <dt className="font-semibold">
                {kind === "required" ? "Required" : "Preferred"} education
              </dt>
              <dd>
                {requirement
                  ? `${EDUCATION_LABELS[requirement.min_level]}; related fields: ${requirement.related_fields.map(keyLabel).join(", ") || "any field"}`
                  : "None specified"}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="space-y-2">
        <h3 className="font-semibold">Languages</h3>
        {opportunity.languages.length > 0 ? (
          <ul className="list-inside list-disc space-y-2 text-sm">
            {opportunity.languages.map((item) => (
              <li key={item.language}>
                {languageLabel(item.language)} ·{" "}
                {LANGUAGE_LEVEL_LABELS[item.min_level]} minimum ·{" "}
                {item.required ? "required" : "preferred"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">None specified</p>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold">Eligibility requirements</h3>
        <p className="text-sm">
          These are the opportunity’s stated rules, not findings about you.
        </p>
        {opportunity.eligibility_requirements.length > 0 ? (
          opportunity.eligibility_requirements.map((requirement, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: read-only rules have no backend IDs and codes can repeat
            <Alert key={`${requirement.code}-${index}`} color="info">
              <p className="font-medium">{requirement.label}</p>
              <p className="mt-1 text-sm">
                Stated rule priority: {requirement.severity}
              </p>
              {requirement.code === "work_authorisation" ? (
                <p className="mt-1 text-sm">
                  Country:{" "}
                  {requirement.params.country
                    ? countryLabel(requirement.params.country)
                    : "not specified"}
                  . Sponsorship:{" "}
                  {requirement.params.sponsorship === null
                    ? "not specified"
                    : requirement.params.sponsorship
                      ? "available"
                      : "not available"}
                  .
                </p>
              ) : null}
              {requirement.code === "licence" ? (
                <p className="mt-1 text-sm">
                  Licence: {requirement.params.licence_type}
                </p>
              ) : null}
            </Alert>
          ))
        ) : (
          <p className="text-sm">No additional eligibility rules specified.</p>
        )}
      </div>
    </section>
  );
}
