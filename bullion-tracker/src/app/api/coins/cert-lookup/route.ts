import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getCoinByCert,
  PCGSApiError,
  AuthenticationError,
  RateLimitError,
  CertNotFoundError,
} from '@/lib/pcgs-api';
import { detectUSCoinMetalContent } from '@/lib/us-coinage-rules';

export const dynamic = 'force-dynamic';

// Request interface
interface CertLookupRequest {
  certNumber: string;
  service: 'pcgs' | 'ngc';
}

// Response interface
interface CertLookupResponse {
  success: boolean;
  service: 'pcgs' | 'ngc';
  requiresManualLookup?: boolean;
  lookupUrl?: string;
  data?: {
    pcgsNumber: number;
    fullName: string;
    year: number;
    mintMark: string | null;
    denomination: string;
    grade: string;
    gradeNumeric: number;
    metal: string | null;
    priceGuide: number | null;
    mintage: number | null;
    imageUrl: string | null;
    matchedCoinId: string | null;
    metalPurity: number | null;
    metalWeightOz: number | null;
    preciousMetalOz: number | null;
  };
  error?: string;
}

/**
 * POST /api/coins/cert-lookup
 *
 * Look up coin data by certification number.
 *
 * Body:
 * - certNumber: string (7-8 digits for PCGS, 7 digits for NGC)
 * - service: "pcgs" | "ngc"
 *
 * Returns:
 * - For PCGS: Full coin data with autofill fields
 * - For NGC: Manual lookup URL (no public API available)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CertLookupRequest;

    const { certNumber, service } = body;

    // Validate input
    if (!certNumber || typeof certNumber !== 'string') {
      return NextResponse.json(
        { success: false, error: 'certNumber is required' },
        { status: 400 }
      );
    }

    if (!service || !['pcgs', 'ngc'].includes(service)) {
      return NextResponse.json(
        { success: false, error: 'service must be "pcgs" or "ngc"' },
        { status: 400 }
      );
    }

    // Handle NGC - no public API available
    if (service === 'ngc') {
      const response: CertLookupResponse = {
        success: true,
        service: 'ngc',
        requiresManualLookup: true,
        lookupUrl: `https://www.ngccoin.com/certlookup/${certNumber}/`,
      };
      return NextResponse.json(response);
    }

    // Handle PCGS - use API
    // Validate cert number format (7-8 digits)
    if (!/^\d{7,8}$/.test(certNumber)) {
      return NextResponse.json(
        {
          success: false,
          service: 'pcgs',
          error: 'Invalid PCGS cert number: must be 7-8 digits',
        },
        { status: 400 }
      );
    }

    // Call PCGS API
    const pcgsData = await getCoinByCert(certNumber);

    // Try to match coin in our database by PCGS number
    let matchedCoinId: string | null = null;
    if (pcgsData.PCGSNo) {
      const matchedCoin = await prisma.coinReference.findFirst({
        where: { pcgsNumber: pcgsData.PCGSNo },
        select: { id: true },
      });
      matchedCoinId = matchedCoin?.id || null;
    }

    // Determine metal from category or species
    let metal: string | null = null;
    const category = pcgsData.CategoryName?.toLowerCase() || '';
    const species = pcgsData.SpeciesName?.toLowerCase() || '';
    if (category.includes('gold') || species.includes('gold')) {
      metal = 'gold';
    } else if (category.includes('silver') || species.includes('silver')) {
      metal = 'silver';
    } else if (category.includes('platinum') || species.includes('platinum')) {
      metal = 'platinum';
    } else if (category.includes('copper') || species.includes('copper')) {
      metal = 'copper';
    }

    // Get best available image
    const imageUrl =
      pcgsData.TrueViewFront ||
      pcgsData.Obverse100ImageURL ||
      null;

    // Get metal content from US coinage rules based on denomination and year
    const metalContent = detectUSCoinMetalContent(pcgsData.Denomination, pcgsData.Year);

    const response: CertLookupResponse = {
      success: true,
      service: 'pcgs',
      data: {
        pcgsNumber: pcgsData.PCGSNo,
        fullName: pcgsData.FullName,
        year: pcgsData.Year,
        mintMark: pcgsData.MintMark,
        denomination: pcgsData.Denomination,
        grade: pcgsData.Grade,
        gradeNumeric: pcgsData.GradeNumeric,
        metal,
        priceGuide: pcgsData.PriceGuideValue,
        mintage: pcgsData.Mintage,
        imageUrl,
        matchedCoinId,
        metalPurity: metalContent?.metalPurity ?? null,
        metalWeightOz: metalContent?.metalWeightOz ?? null,
        preciousMetalOz: metalContent?.preciousMetalOz ?? null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[cert-lookup] Error:', error);

    // Handle specific errors
    if (error instanceof CertNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          service: 'pcgs',
          error: 'Certificate not found',
        },
        { status: 404 }
      );
    }

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        {
          success: false,
          service: 'pcgs',
          error: 'PCGS API authentication failed',
        },
        { status: 502 }
      );
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          success: false,
          service: 'pcgs',
          error: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    if (error instanceof PCGSApiError) {
      return NextResponse.json(
        {
          success: false,
          service: 'pcgs',
          error: error.message,
        },
        { status: error.statusCode || 502 }
      );
    }

    // Unknown error
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
