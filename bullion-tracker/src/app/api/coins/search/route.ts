import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search coins by full name, series, or year
    const coins = await prisma.coinReference.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { series: { contains: query, mode: 'insensitive' } },
          { year: isNaN(parseInt(query)) ? undefined : parseInt(query) },
        ],
      },
      take: limit,
      orderBy: [
        { series: 'asc' },
        { year: 'desc' },
      ],
    });

    return NextResponse.json(coins);
  } catch (error) {
    console.error('Coin search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
