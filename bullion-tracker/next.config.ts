import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production
  silent: !process.env.CI,

  // Upload source maps for better error tracking
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors (if configured)
  automaticVercelMonitors: true,
};

// Only wrap with Sentry if the SDK is properly configured
const hasSentryConfig = process.env.SENTRY_ORG && process.env.SENTRY_PROJECT;

export default hasSentryConfig
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
