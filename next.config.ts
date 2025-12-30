import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration des images externes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
