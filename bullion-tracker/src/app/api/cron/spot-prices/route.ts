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
 * Schedule: Every 8 hours (3 times daily) - configured in vercel.json
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

    const startTime = Date.now();

    // Fetch current prices from Metal Price API
    const url = `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG,XPT`;

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

    if (!data.rates.XAU || !data.rates.XAG || !data.rates.XPT) {
      throw new Error('Missing metal rates in API response');
    }

    // Convert rates to USD per ounce
    const goldPrice = 1 / data.rates.XAU;
    const silverPrice = 1 / data.rates.XAG;
    const platinumPrice = 1 / data.rates.XPT;

    const now = new Date();

    // Save to PriceHistory table
    await prisma.$transaction([
      prisma.priceHistory.create({
        data: {
          metal: 'gold',
          priceOz: goldPrice,
          timestamp: now,
        },
      }),
      prisma.priceHistory.create({
        data: {
          metal: 'silver',
          priceOz: silverPrice,
          timestamp: now,
        },
      }),
      prisma.priceHistory.create({
        data: {
          metal: 'platinum',
          priceOz: platinumPrice,
          timestamp: now,
        },
      }),
    ]);

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
        prices: {
          gold: Math.round(goldPrice * 100) / 100,
          silver: Math.round(silverPrice * 100) / 100,
          platinum: Math.round(platinumPrice * 100) / 100,
        },
        timestamp: now.toISOString(),
        cleanedUp: deleted.count,
        message: 'Spot prices saved successfully',
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
