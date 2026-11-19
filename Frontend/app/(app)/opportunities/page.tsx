import { auth } from "@clerk/nextjs/server";
import OpportunitiesScreen from "@/components/OpportunitiesScreen/OpportunitiesScreen";
import type { ScreenSearchProps } from "@/lib/queries/navigation.ts";

export default async function Page(props: ScreenSearchProps) {
  await auth.protect();
  return <OpportunitiesScreen {...props} />;
}
