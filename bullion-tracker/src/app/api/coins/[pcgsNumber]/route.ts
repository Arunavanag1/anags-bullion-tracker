import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pcgsNumber: string }> }
) {
  try {
    const params = await context.params;
    const pcgsNumber = parseInt(params.pcgsNumber);

    if (isNaN(pcgsNumber)) {
      return NextResponse.json({ error: 'Invalid PCGS number' }, { status: 400 });
    }

    const coin = await prisma.coinReference.findUnique({
      where: { pcgsNumber },
      include: {
        priceGuides: {
          orderBy: { priceDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!coin) {
      return NextResponse.json({ error: 'Coin not found' }, { status: 404 });
    }

    return NextResponse.json(coin);
  } catch (error) {
    console.error('Get coin error:', error);
    return NextResponse.json({ error: 'Failed to fetch coin' }, { status: 500 });
  }
}
