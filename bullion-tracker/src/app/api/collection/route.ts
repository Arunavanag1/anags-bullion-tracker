import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { validationError, notFoundError, rateLimitedError, handleApiError } from '@/lib/api-errors';
import { checkCollectionRateLimit } from '@/lib/ratelimit';
import { sanitizeString, validatePositiveNumber, validateEnum } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/collection
 * Returns collection items for the user with optional cursor-based pagination
 *
 * Query params:
 *   - cursor: ID of the last item from previous page (optional)
 *   - limit: Number of items per page (default: all, max: 100 when paginating)
 *
 * When limit is not provided, returns all items for backwards compatibility.
 * When limit is provided, returns paginated response with pagination metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);

    const cursorParam = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');

    // If no limit specified, return all items (backwards compatibility)
    if (!limitParam) {
      const items = await prisma.collectionItem.findMany({
        where: { userId },
        include: {
          images: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: items,
      });
    }

    // Validate and cap limit
    const limitValidation = validatePositiveNumber(Number(limitParam), 'limit');
    if (!limitValidation.valid) {
      throw validationError(limitValidation.reason!);
    }
    const limit = Math.min(Number(limitParam), 100); // Cap at 100

    // Build query with cursor pagination
    const items = await prisma.collectionItem.findMany({
      where: { userId },
      take: limit + 1, // Fetch one extra to detect hasMore
      cursor: cursorParam ? { id: cursorParam } : undefined,
      skip: cursorParam ? 1 : 0, // Skip cursor item itself
      include: {
        images: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Detect if there are more items
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? resultItems[resultItems.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: resultItems,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
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

    // Check rate limit
    const rateLimit = await checkCollectionRateLimit(userId);
    if (!rateLimit.success) {
      throw rateLimitedError(rateLimit.reset);
    }

    const body = await request.json();

    // Validate category
    const categoryValidation = validateEnum(body.category, ['BULLION', 'NUMISMATIC'] as const, 'category');
    if (!categoryValidation.valid) {
      throw validationError(categoryValidation.reason!, { allowed: ['BULLION', 'NUMISMATIC'] });
    }
    const category = body.category;

    // Build create data based on category
    const createData: Record<string, unknown> = {
      userId,
      category,
    };

    if (category === 'BULLION') {
      // Validate bullion required fields
      const { type, metal, weightOz, bookValueType, spotPriceAtCreation } = body;

      if (!type || !metal || weightOz === undefined || !bookValueType || spotPriceAtCreation === undefined) {
        throw validationError('Missing required bullion fields', {
          required: ['type', 'metal', 'weightOz', 'bookValueType', 'spotPriceAtCreation'],
        });
      }

      // Validate metal type
      const metalValidation = validateEnum(metal, ['gold', 'silver', 'platinum'] as const, 'metal');
      if (!metalValidation.valid) {
        throw validationError(metalValidation.reason!, { allowed: ['gold', 'silver', 'platinum'] });
      }

      // Validate numeric fields
      const weightValidation = validatePositiveNumber(weightOz, 'weightOz');
      if (!weightValidation.valid) {
        throw validationError(weightValidation.reason!);
      }

      if (body.quantity !== undefined) {
        const quantityValidation = validatePositiveNumber(body.quantity, 'quantity');
        if (!quantityValidation.valid) {
          throw validationError(quantityValidation.reason!);
        }
      }

      // Sanitize string inputs
      createData.type = sanitizeString(type, 100);
      createData.metal = metal;
      createData.quantity = body.quantity || 1;
      createData.weightOz = Number(weightOz);
      createData.bookValueType = bookValueType;
      createData.spotPriceAtCreation = Number(spotPriceAtCreation);

      if (body.title !== undefined) createData.title = sanitizeString(body.title, 200);
      if (body.customBookValue !== undefined) createData.customBookValue = Number(body.customBookValue);
      if (body.premiumPercent !== undefined) createData.premiumPercent = Number(body.premiumPercent);
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

      if (body.certNumber !== undefined) createData.certNumber = sanitizeString(body.certNumber, 50);
      if (body.isProblemCoin !== undefined) createData.isProblemCoin = body.isProblemCoin;
      if (body.problemType !== undefined) createData.problemType = sanitizeString(body.problemType, 100);
      if (body.isGradeEstimated !== undefined) createData.isGradeEstimated = body.isGradeEstimated;
      if (body.customBookValue !== undefined) createData.customBookValue = Number(body.customBookValue);
      if (body.numismaticValue !== undefined) createData.numismaticValue = Number(body.numismaticValue);
    }

    // Add common optional fields with sanitization
    if (body.notes !== undefined) createData.notes = sanitizeString(body.notes, 1000);
    if (body.purchaseDate) createData.purchaseDate = new Date(body.purchaseDate);
    if (body.purchasePrice !== undefined) createData.purchasePrice = Number(body.purchasePrice);
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
      data: createData as Prisma.CollectionItemCreateInput,
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
