import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coins/price-guide?coinReferenceId=xxx&grade=MS65
 * Returns the price guide value for a coin and grade
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const coinReferenceId = searchParams.get('coinReferenceId');
    const gradeCode = searchParams.get('grade');

    if (!coinReferenceId || !gradeCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing coinReferenceId or grade parameter',
        },
        { status: 400 }
      );
    }

    // Fetch the most recent price guide entry for this coin and grade
    const priceGuide = await prisma.coinPriceGuide.findFirst({
      where: {
        coinReferenceId,
        gradeCode,
      },
      orderBy: {
        priceDate: 'desc',
      },
    });

    if (!priceGuide) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No price guide data available for this coin and grade',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        price: priceGuide.pcgsPrice ? parseFloat(priceGuide.pcgsPrice.toString()) : null,
        priceDate: priceGuide.priceDate,
        confidenceLevel: 'high', // Since it's from PCGS official data
      },
    });
  } catch (error: any) {
    console.error('Error fetching price guide:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch price guide',
      },
      { status: 500 }
    );
  }
}
