import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import type { NextConfig } from "next";
import { loadRootEnv } from "./load-root-env.mjs";

loadRootEnv();

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: false,
  reactCompiler: false,
};

export default withFlowbiteReact(nextConfig);
