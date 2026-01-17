import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic'; // Don't cache this route

type CheckStatus = 'ok' | 'error' | 'not_configured';

interface HealthCheck {
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    spotPrices: HealthCheck;
  };
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      error: 'Database connection failed',
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { status: 'not_configured' };
  }

  const start = Date.now();
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.ping();
    return {
      status: 'ok',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      error: 'Redis connection failed',
    };
  }
}

function checkSpotPrices(): HealthCheck {
  if (!process.env.NEXT_PUBLIC_METAL_PRICE_API_KEY) {
    return { status: 'not_configured' };
  }
  return { status: 'ok' };
}

function determineOverallStatus(checks: HealthResponse['checks']): HealthResponse['status'] {
  // Database is critical - if it's down, we're unhealthy
  if (checks.database.status === 'error') {
    return 'unhealthy';
  }

  // Redis and spot prices are non-critical - if they're down, we're degraded
  const hasDegradedService =
    checks.redis.status === 'error' || checks.spotPrices.status === 'error';

  if (hasDegradedService) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * GET /api/health
 * Returns health status of the application and its dependencies
 */
export async function GET() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  const spotPrices = checkSpotPrices();

  const checks = { database, redis, spotPrices };
  const status = determineOverallStatus(checks);

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    checks,
  };

  const httpStatus = status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}
