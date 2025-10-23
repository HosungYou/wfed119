import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    turbo: {
      resolveAlias: {
        // Fix path resolution issues
        '@': './src',
      },
    },
  },
  // Disable source maps in development to avoid path issues
  productionBrowserSourceMaps: false,
};

export default nextConfig;
