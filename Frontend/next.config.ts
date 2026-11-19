import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import type { NextConfig } from "next";
import { loadRootEnv } from "./load-root-env.mjs";

loadRootEnv();
// Never auto-provision a claimable Clerk instance when credentials are absent.
process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED = "true";

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: false,
  reactCompiler: false,
};

export default withFlowbiteReact(nextConfig);
