// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is configured
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Environment from Vercel or fallback to development
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Enable replay for 10% of sessions, 100% on error
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
