import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for production deployments (smaller footprint)
  output: 'standalone',

  // Image optimization with Cloudinary remote patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // Experimental optimizations for large libraries
  experimental: {
    optimizePackageImports: ['recharts', 'gsap'],
  },
};

export default nextConfig;
