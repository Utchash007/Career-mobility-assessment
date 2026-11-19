import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import type { NextConfig } from "next";
import { loadRootEnv } from "./load-root-env.mjs";

loadRootEnv();
// Never auto-provision a claimable Clerk instance when credentials are absent.
process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED = "true";

const nextConfig: NextConfig = {
  output: "standalone",
  agentRules: false,
  cacheComponents: false,
  reactCompiler: false,
  env: {
    // Build-time routing flag, not a credential. Browser requests stay on the
    // current public origin when Next.js and FastAPI share this container.
    NEXT_PUBLIC_API_SAME_ORIGIN:
      process.env.PANAMA_SINGLE_CONTAINER === "true" ? "true" : "false",
  },
  async rewrites() {
    if (process.env.PANAMA_SINGLE_CONTAINER !== "true") return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8000/api/v1/:path*",
      },
      {
        source: "/health",
        destination: "http://127.0.0.1:8000/health",
      },
    ];
  },
};

export default withFlowbiteReact(nextConfig);
