import { auth } from "@clerk/nextjs/server";
import RecommendationsScreen from "@/components/RecommendationsScreen/RecommendationsScreen";
import type { ScreenSearchProps } from "@/lib/queries/navigation.ts";

export default async function Page(props: ScreenSearchProps) {
  await auth.protect();
  return <RecommendationsScreen {...props} />;
}
