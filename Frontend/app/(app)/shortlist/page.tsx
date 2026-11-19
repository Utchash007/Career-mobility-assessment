import { auth } from "@clerk/nextjs/server";
import ShortlistScreen from "@/components/ShortlistScreen/ShortlistScreen";
import type { ScreenSearchProps } from "@/lib/queries/navigation.ts";

export default async function Page(props: ScreenSearchProps) {
  await auth.protect();
  return <ShortlistScreen {...props} />;
}
