import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { validationError, notFoundError, handleApiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/collection
 * Returns all collection items for the user
 */
export async function GET() {
  try {
    const userId = await getUserId();

    const items = await prisma.collectionItem.findMany({
      where: {
        userId,
      },
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    return handleApiError(error, 'fetch collection items');
  }
}

/**
 * POST /api/collection
 * Create a new collection item
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const { category } = body;

    // Build create data based on category
    const createData: any = {
      userId,
      category,
    };

    if (category === 'BULLION') {
      // Validate bullion required fields
      const { type, metal, weightOz, bookValueType, spotPriceAtCreation } = body;

      if (!type || !metal || !weightOz || !bookValueType || spotPriceAtCreation === undefined) {
        throw validationError('Missing required bullion fields', {
          required: ['type', 'metal', 'weightOz', 'bookValueType', 'spotPriceAtCreation'],
        });
      }

      createData.type = type;
      createData.metal = metal;
      createData.quantity = body.quantity || 1;
      createData.weightOz = weightOz;
      createData.bookValueType = bookValueType;
      createData.spotPriceAtCreation = spotPriceAtCreation;

      if (body.title !== undefined) createData.title = body.title;
      if (body.customBookValue !== undefined) createData.customBookValue = body.customBookValue;
      if (body.premiumPercent !== undefined) createData.premiumPercent = body.premiumPercent;
    } else if (category === 'NUMISMATIC') {
      // Validate numismatic required fields
      const { coinReferenceId, grade, gradingService, bookValueType, metal } = body;

      if (!coinReferenceId || !grade || !gradingService || !bookValueType) {
        throw validationError('Missing required numismatic fields', {
          required: ['coinReferenceId', 'grade', 'gradingService', 'bookValueType'],
        });
      }

      // Fetch coin reference to get metal, weight, and build title
      const coinReference = await prisma.coinReference.findUnique({
        where: { id: coinReferenceId },
      });

      if (!coinReference) {
        throw notFoundError('Coin reference not found');
      }

      // Use provided metal, or fall back to coin reference metal
      const finalMetal = metal || coinReference.metal || 'silver';
      const finalWeightOz = coinReference.weightOz ? parseFloat(coinReference.weightOz.toString()) : null;

      // Build title: [Year] [Grading Service/RAW] [Grade] [Denomination] [Coin Name]
      // Example: "2025 PCGS MS65 $1 Morgan Dollar"
      const gradingLabel = gradingService === 'RAW' ? 'RAW' : gradingService;
      const gradeLabel = body.isGradeEstimated ? `~${grade}` : grade;
      const title = `${coinReference.year} ${gradingLabel} ${gradeLabel} ${coinReference.denomination} ${coinReference.series}`.trim();

      createData.coinReferenceId = coinReferenceId;
      createData.grade = grade;
      createData.gradingService = gradingService;
      createData.bookValueType = bookValueType;
      createData.metal = finalMetal;
      createData.title = title;
      if (finalWeightOz !== null) createData.weightOz = finalWeightOz;

      if (body.certNumber !== undefined) createData.certNumber = body.certNumber;
      if (body.isProblemCoin !== undefined) createData.isProblemCoin = body.isProblemCoin;
      if (body.problemType !== undefined) createData.problemType = body.problemType;
      if (body.isGradeEstimated !== undefined) createData.isGradeEstimated = body.isGradeEstimated;
      if (body.customBookValue !== undefined) createData.customBookValue = body.customBookValue;
      if (body.numismaticValue !== undefined) createData.numismaticValue = body.numismaticValue;
    } else {
      throw validationError('Invalid category', {
        allowed: ['BULLION', 'NUMISMATIC'],
        received: category,
      });
    }

    // Add common optional fields
    if (body.notes !== undefined) createData.notes = body.notes;
    if (body.purchaseDate) createData.purchaseDate = new Date(body.purchaseDate);
    if (body.purchasePrice !== undefined) createData.purchasePrice = body.purchasePrice;
    if (body.images && body.images.length > 0) {
      createData.images = {
        create: body.images.map((url: string, index: number) => ({
          url,
          order: index,
        })),
      };
    }

    // Create the item
    const item = await prisma.collectionItem.create({
      data: createData,
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    return handleApiError(error, 'create collection item');
  }
}
