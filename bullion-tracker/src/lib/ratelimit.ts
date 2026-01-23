import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if running in production
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// Use in-memory store for development (no Upstash account needed)
// In production, configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Runtime check flag - will be validated when rate limiting is used
const rateLimitingDisabledInProduction = !redis && isProduction;

// Auth rate limiter: 5 requests per 60 seconds per IP
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null;

// Collection rate limiter: 30 requests per 60 seconds per user ID
// More permissive than auth since these are authenticated operations
export const collectionRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      analytics: true,
      prefix: 'ratelimit:collection',
    })
  : null;

// Helper to get client IP
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

// Rate limit check helper for auth routes (by IP)
export async function checkRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  // Fail hard if rate limiting is disabled in production (runtime check)
  if (rateLimitingDisabledInProduction) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL is required in production. ' +
      'Rate limiting protects against brute-force attacks. ' +
      'Configure Upstash Redis or set NODE_ENV=development.'
    );
  }

  if (!authRateLimiter) {
    // No rate limiting in development without Upstash
    return { success: true };
  }

  const result = await authRateLimiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// Rate limit check helper for collection routes (by user ID)
export async function checkCollectionRateLimit(
  userId: string
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  // Fail hard if rate limiting is disabled in production (runtime check)
  if (rateLimitingDisabledInProduction) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL is required in production. ' +
      'Rate limiting protects against brute-force attacks. ' +
      'Configure Upstash Redis or set NODE_ENV=development.'
    );
  }

  if (!collectionRateLimiter) {
    // No rate limiting in development without Upstash
    return { success: true };
  }

  const result = await collectionRateLimiter.limit(userId);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
