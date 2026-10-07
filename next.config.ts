import type { NextConfig } from "next";

const projectDir = process.cwd();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectDir,
  turbopack: {
    root: projectDir,
  },
  devIndicators: false,
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
