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
};

export default nextConfig;
