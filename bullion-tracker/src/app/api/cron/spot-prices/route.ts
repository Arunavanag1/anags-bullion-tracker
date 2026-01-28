import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

interface MetalPriceAPIResponse {
  success: boolean;
  timestamp: number;
  base: string;
  rates: {
    XAU?: number;
    XAG?: number;
    XPT?: number;
  };
}

/**
 * GET /api/cron/spot-prices
 *
 * Cron endpoint for tracking spot prices. Called multiple times daily to:
 * 1. Fetch current spot prices from Metal Price API
 * 2. Save prices to PriceHistory table for 24h change calculations
 *
 * This ensures we always have accurate historical data for calculating
 * the 24-hour price change percentage.
 *
 * Query params:
 * - metals: comma-separated list of metals to fetch (gold,silver,platinum)
 *   Defaults to all if not specified
 *
 * Schedule: Every hour (configured in vercel.json)
 * ~720 API calls/month (24/day × 30 days)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiKey = process.env.METAL_PRICE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Parse metals query parameter
    const { searchParams } = new URL(request.url);
    const metalsParam = searchParams.get('metals');
    const requestedMetals = metalsParam
      ? metalsParam.split(',').map(m => m.trim().toLowerCase())
      : ['gold', 'silver', 'platinum'];

    // Map metal names to API symbols
    const metalToSymbol: Record<string, string> = {
      gold: 'XAU',
      silver: 'XAG',
      platinum: 'XPT',
    };

    const validMetals = requestedMetals.filter(m => metalToSymbol[m]);
    if (validMetals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid metals specified' },
        { status: 400 }
      );
    }

    const currencies = validMetals.map(m => metalToSymbol[m]).join(',');

    const startTime = Date.now();

    // Fetch current prices from Metal Price API
    const url = `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=${currencies}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data: MetalPriceAPIResponse = await response.json();

    if (!data.success || !data.rates) {
      throw new Error('Invalid response from Metal Price API');
    }

    const now = new Date();
    const prices: Record<string, number> = {};
    const dbOperations = [];

    // Process each requested metal
    for (const metal of validMetals) {
      const symbol = metalToSymbol[metal] as keyof typeof data.rates;
      const rate = data.rates[symbol];

      if (!rate) {
        console.warn(`Missing rate for ${metal} (${symbol})`);
        continue;
      }

      const priceOz = 1 / rate;
      prices[metal] = Math.round(priceOz * 100) / 100;

      dbOperations.push(
        prisma.priceHistory.create({
          data: {
            metal,
            priceOz,
            timestamp: now,
          },
        })
      );
    }

    if (dbOperations.length === 0) {
      throw new Error('No valid prices received from API');
    }

    // Save to PriceHistory table
    await prisma.$transaction(dbOperations);

    // Clean up old entries (keep only last 90 days to prevent DB bloat)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.priceHistory.deleteMany({
      where: {
        timestamp: { lt: ninetyDaysAgo },
      },
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        metals: validMetals,
        prices,
        timestamp: now.toISOString(),
        cleanedUp: deleted.count,
        message: `Spot prices saved for: ${validMetals.join(', ')}`,
        durationMs,
      },
    });
  } catch (error) {
    console.error('Cron spot-prices error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
