import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface CoinSearchResult {
  id: string;
  pcgsNumber: number;
  year: number;
  mintMark: string | null;
  denomination: string;
  series: string;
  fullName: string;
  metal: string | null;
}

/**
 * GET /api/coins/search
 *
 * Search coins using PostgreSQL full-text search with relevance ranking.
 *
 * Query params:
 * - q: Search query (required, min 2 chars)
 * - limit: Max results (default 10)
 *
 * Search behavior:
 * - 3+ chars: Full-text search with ts_rank ordering
 * - Numeric queries: Also search by year or PCGS number
 * - Short queries (1-2 chars): LIKE fallback for prefix matching
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);

    if (!query || query.length < 1) {
      return NextResponse.json([]);
    }

    // Check if query is numeric (year or PCGS number)
    const numericQuery = parseInt(query);
    const isNumeric = !isNaN(numericQuery);

    // For very short queries or pure numeric, use simple LIKE/equals
    if (query.length < 3 || (isNumeric && query.length <= 4)) {
      let coins;

      if (isNumeric) {
        // Search by year or PCGS number
        coins = await prisma.coinReference.findMany({
          where: {
            OR: [
              { year: numericQuery },
              { pcgsNumber: numericQuery },
            ],
          },
          take: limit,
          orderBy: [{ year: 'desc' }, { series: 'asc' }],
          select: {
            id: true,
            pcgsNumber: true,
            year: true,
            mintMark: true,
            denomination: true,
            series: true,
            fullName: true,
            metal: true,
          },
        });
      } else {
        // Short text query - use LIKE prefix match
        coins = await prisma.coinReference.findMany({
          where: {
            OR: [
              { fullName: { startsWith: query, mode: 'insensitive' } },
              { series: { startsWith: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          orderBy: [{ series: 'asc' }, { year: 'desc' }],
          select: {
            id: true,
            pcgsNumber: true,
            year: true,
            mintMark: true,
            denomination: true,
            series: true,
            fullName: true,
            metal: true,
          },
        });
      }

      return NextResponse.json(coins);
    }

    // Use LIKE search (searchVector column not available in production)
    const coins = await prisma.coinReference.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { series: { contains: query, mode: 'insensitive' } },
          { denomination: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: [{ series: 'asc' }, { year: 'desc' }],
      select: {
        id: true,
        pcgsNumber: true,
        year: true,
        mintMark: true,
        denomination: true,
        series: true,
        fullName: true,
        metal: true,
      },
    });

    return NextResponse.json(coins);
  } catch (error) {
    console.error('Coin search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
