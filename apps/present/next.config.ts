import { resolve } from "node:path";
import type { NextConfig } from "next";

const repositoryRoot = resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@deckory/schema", "@deckory/core", "@deckory/deckory-story"],
  turbopack: {
    root: repositoryRoot
  }
};

export default nextConfig;
