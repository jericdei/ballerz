import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

config({ path: path.join(rootDir, ".env") });
config({ path: path.join(rootDir, ".env.local") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/db", "@repo/api"],
  experimental: {
    viewTransition: true,
  },
  allowedDevOrigins: ["192.168.1.61"],
};

export default nextConfig;
