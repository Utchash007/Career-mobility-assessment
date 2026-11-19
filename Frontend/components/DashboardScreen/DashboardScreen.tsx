import { Card } from "flowbite-react";
import ApiFeedback from "@/components/ApiFeedback/ApiFeedback";
import EmptyState from "@/components/EmptyState/EmptyState";
import LinkButton from "@/components/LinkButton/LinkButton";
import ProfileSummary from "@/components/ProfileSummary/ProfileSummary";
import RecommendationCard from "@/components/RecommendationCard/RecommendationCard";
import ShortlistAction from "@/components/ShortlistAction/ShortlistAction";
import type { ApiClient } from "@/lib/api/client.ts";
import { asApiFailure, isMissingProfile } from "@/lib/api/errors.ts";
import { serverApi } from "@/lib/api/server.ts";

export default async function DashboardScreen() {
  let api: ApiClient;
  try {
    api = await serverApi();
  } catch (error) {
    return <ApiFeedback reason={asApiFailure(error).reason} />;
  }
  const profileRead = api.getProfile();
  const [profile, catalog, shortlist, matches] = await Promise.allSettled([
    profileRead,
    api.getOpportunities({ page: 1, page_size: 1, sort: "id_asc" }),
    api.getShortlist({ page: 1, page_size: 1, sort: "created_at_desc" }),
    profileRead.then(() => api.getMatches({ page: 1, page_size: 3 })),
  ]);
  if (
    [profile, catalog, shortlist, matches].some(
      (result) =>
        result.status === "rejected" &&
        asApiFailure(result.reason).reason === "session_expired",
    )
  )
    return <ApiFeedback reason="session_expired" />;
  return (
    <div className="space-y-10">
      <section className="space-y-5 rounded-3xl border border-accent/25 bg-soft-accent/20 p-7 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-action">
          Career Mobility
        </p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
          Your next step, with evidence.
        </h1>
        <p className="max-w-2xl text-sm leading-7">
          Build a truthful profile, explore opportunities and understand the
          backend’s matching reasons. Keep legal eligibility and skill fit
          separate.
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/profile">
            {profile.status === "fulfilled"
              ? "Review your profile"
              : "Start with your profile"}
          </LinkButton>
          <LinkButton color="alternative" href="/opportunities">
            Explore opportunities
          </LinkButton>
        </div>
      </section>
      {profile.status === "fulfilled" ? (
        <ProfileSummary
          profile={{
            full_name: profile.value.full_name,
            education: profile.value.education,
            experience_years: profile.value.experience_years,
            skills: profile.value.skills,
          }}
        />
      ) : (
        <ApiFeedback
          reason={asApiFailure(profile.reason).reason}
          profileRequired={isMissingProfile(profile.reason)}
        />
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Opportunity catalog</h2>
          {catalog.status === "fulfilled" ? (
            <p>{catalog.value.pagination.total} opportunities available</p>
          ) : (
            <ApiFeedback reason={asApiFailure(catalog.reason).reason} />
          )}
          <LinkButton href="/opportunities" color="alternative">
            Browse catalog
          </LinkButton>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Your saved next steps</h2>
          {shortlist.status === "fulfilled" ? (
            <p>{shortlist.value.pagination.total} saved opportunities</p>
          ) : (
            <ApiFeedback
              reason={asApiFailure(shortlist.reason).reason}
              profileRequired={isMissingProfile(shortlist.reason)}
            />
          )}
          <LinkButton href="/shortlist" color="alternative">
            Open shortlist
          </LinkButton>
        </Card>
      </div>
      <section aria-label="Top matches" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">
            Start with your top matches
          </h2>
          <LinkButton href="/recommendations" color="alternative">
            See all matches
          </LinkButton>
        </div>
        {matches.status === "rejected" ? (
          <ApiFeedback
            reason={asApiFailure(matches.reason).reason}
            profileRequired={isMissingProfile(matches.reason)}
          />
        ) : matches.value.items.length === 0 ? (
          <EmptyState
            title="No matches returned"
            description="Review your profile or explore the opportunity catalog. A successful empty result is different from a service failure."
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {matches.value.items.map((item) => (
              <RecommendationCard key={item.opportunity.id} item={item}>
                <ShortlistAction
                  opportunityId={item.opportunity.id}
                  initialSaved={item.opportunity.is_shortlisted}
                />
              </RecommendationCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
