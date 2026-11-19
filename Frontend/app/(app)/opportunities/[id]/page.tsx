import { auth } from "@clerk/nextjs/server";
import OpportunityDetailScreen from "@/components/OpportunityDetailScreen/OpportunityDetailScreen";
import type { DetailScreenProps } from "@/lib/queries/details.ts";

export default async function Page(props: DetailScreenProps) {
  await auth.protect();
  return <OpportunityDetailScreen {...props} />;
}
