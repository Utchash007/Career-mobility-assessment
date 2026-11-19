import Link from "next/link";
import EmptyState from "@/components/EmptyState/EmptyState";
import { APP_ROUTES } from "@/lib/display/navigation.ts";

export interface NotFoundScreenProps {
  resource?: "page" | "opportunity";
}

export default function NotFoundScreen({
  resource = "page",
}: NotFoundScreenProps) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-action">
          Not found
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {resource === "opportunity"
            ? "This opportunity is not available."
            : "We could not find that page."}
        </h1>
      </div>
      <EmptyState
        title="Start again from home"
        description="The address may be incorrect, or the resource may no longer be available. No private information is shown on this screen."
        action={
          <Link
            href={APP_ROUTES.home}
            className="rounded-sm text-sm font-semibold text-action underline decoration-action/40 underline-offset-4 hover:text-action-hover"
          >
            Return home
          </Link>
        }
      />
    </section>
  );
}
