import { defineConfig } from "eslint/config";
import nextConfig from "eslint-config-next/core-web-vitals.js";

export default defineConfig([
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
]);
