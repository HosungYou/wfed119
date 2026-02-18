/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  serverExternalPackages: ["@prisma/client"],
  // Enable standalone output for Docker/Render (skip on Vercel)
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  // Fix workspace root inference when multiple lockfiles exist
  outputFileTracingRoot: path.join(__dirname),
  // Skip TypeScript type checking during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during build for deployment  
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Handle node modules that are not compatible with webpack
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Allow additional domains for images if needed
  images: {
    domains: ['localhost'],
  },
  // Disable telemetry in development
  ...(process.env.NODE_ENV === 'development' && {
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
    },
  }),
};

module.exports = nextConfig;
