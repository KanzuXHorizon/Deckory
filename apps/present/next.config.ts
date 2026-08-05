import { resolve } from "node:path";
import type { NextConfig } from "next";

const repositoryRoot = resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  transpilePackages: ["@deckory/schema", "@deckory/core", "@deckory/deckory-story"],
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  turbopack: {
    root: repositoryRoot
  }
};

export default nextConfig;
