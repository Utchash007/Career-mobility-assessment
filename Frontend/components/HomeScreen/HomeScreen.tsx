import ConfigurationNotice from "@/components/ConfigurationNotice/ConfigurationNotice";
import WorkflowPreviewCard from "@/components/WorkflowPreviewCard/WorkflowPreviewCard";

export default function HomeScreen() {
  return (
    <div className="space-y-10 sm:space-y-14">
      <section
        aria-labelledby="home-title"
        className="rounded-3xl border border-accent/25 bg-soft-accent/20 p-6 sm:p-10 lg:p-14"
      >
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-action">
            Career Mobility · Interface foundation
          </p>
          <h1
            id="home-title"
            className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            Build your profile.
            <br />
            Understand your options.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-ink sm:text-lg">
            A structured starting point for exploring career opportunities,
            understanding match evidence, and keeping your next steps together.
          </p>
          <p className="inline-flex rounded-lg border border-action/30 bg-canvas px-3 py-2 text-sm font-medium text-action">
            Signed-in preview — feature screens are being connected phase by
            phase
          </p>
        </div>
      </section>

      <ConfigurationNotice kind="preview" />

      <section aria-labelledby="workflows-title" className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2
            id="workflows-title"
            className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            One profile. Clearer next steps.
          </h2>
          <p className="text-sm leading-6 text-ink">
            These workflows will be connected in later phases. The cards below
            describe the plan, not saved data or calculated results.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <WorkflowPreviewCard
            step="01"
            title="Describe your background"
            description="Keep education, experience, skills and preferences in one profile. Leave uncertain answers unknown instead of inventing details."
          />
          <WorkflowPreviewCard
            step="02"
            title="Explore with evidence"
            description="Browse opportunities and read match explanations. The backend determines scores, eligibility and ordering; the interface presents them."
          />
          <WorkflowPreviewCard
            step="03"
            title="Keep your next steps together"
            description="Save opportunities with private notes. Manage application data separately from the identity handled by Clerk."
          />
        </div>
      </section>
    </div>
  );
}
