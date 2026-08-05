import { resolve } from "node:path";
import type { NextConfig } from "next";

const repositoryRoot = resolve(process.cwd(), "../..");
const isolatedDistDir = process.env.DECKORY_NEXT_DIST_DIR?.trim();

const nextConfig: NextConfig = {
  ...(isolatedDistDir ? { distDir: isolatedDistDir } : {}),
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  transpilePackages: ["@deckory/schema", "@deckory/core", "@deckory/deckory-story", "@deckory/template-gallery"],
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  turbopack: {
    root: repositoryRoot
  }
};

export default nextConfig;
