import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { validationError, notFoundError, rateLimitedError, handleApiError } from '@/lib/api-errors';
import { checkCollectionRateLimit } from '@/lib/ratelimit';
import { sanitizeString, validatePositiveNumber, validateEnum } from '@/lib/validation';
import { detectUSCoinMetalContent } from '@/lib/us-coinage-rules';
import { calculatePreciousMetalOz } from '@/lib/metal-content';

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
      const { coinReferenceId, grade, gradingService, bookValueType, metal, title: customTitle } = body;

      // Require either coinReferenceId OR title (for custom coins)
      if (!grade || !gradingService || !bookValueType) {
        throw validationError('Missing required numismatic fields', {
          required: ['grade', 'gradingService', 'bookValueType'],
        });
      }

      if (!coinReferenceId && !customTitle) {
        throw validationError('Either coinReferenceId or title is required for numismatic items', {
          required: ['coinReferenceId OR title'],
        });
      }

      let finalMetal = metal || 'silver';
      let finalWeightOz: number | null = null;
      let title: string;

      if (coinReferenceId) {
        // Fetch coin reference to get metal, weight, and build title
        const coinReference = await prisma.coinReference.findUnique({
          where: { id: coinReferenceId },
        });

        if (!coinReference) {
          throw notFoundError('Coin reference not found');
        }

        // Use provided metal, or fall back to coin reference metal
        finalMetal = metal || coinReference.metal || 'silver';
        finalWeightOz = coinReference.weightOz ? parseFloat(coinReference.weightOz.toString()) : null;

        // Apply US historical coinage rules for metal content
        // CoinReference fineness/weightOz takes precedence if present
        if (coinReference.fineness && coinReference.weightOz) {
          // Use coinReference data directly
          const purity = parseFloat(coinReference.fineness.toString());
          const weight = parseFloat(coinReference.weightOz.toString());
          createData.metalPurity = purity;
          createData.metalWeightOz = weight;
          createData.preciousMetalOz = Math.round(purity * weight * 1000000) / 1000000;
        } else {
          // Fall back to US coinage rules detection
          const metalContent = detectUSCoinMetalContent(coinReference.denomination, coinReference.year);
          if (metalContent) {
            createData.metalPurity = metalContent.metalPurity;
            createData.metalWeightOz = metalContent.metalWeightOz;
            createData.preciousMetalOz = metalContent.preciousMetalOz;
          }
        }

        // Build title: [Year] [Grading Service/RAW] [Grade] [Denomination] [Coin Name]
        // Example: "2025 PCGS MS65 $1 Morgan Dollar"
        const gradingLabel = gradingService === 'RAW' ? 'RAW' : gradingService;
        const gradeLabel = body.isGradeEstimated ? `~${grade}` : grade;
        title = `${coinReference.year} ${gradingLabel} ${gradeLabel} ${coinReference.denomination} ${coinReference.series}`.trim();

        createData.coinReferenceId = coinReferenceId;
      } else {
        // Custom coin - use provided title and metal
        const gradingLabel = gradingService === 'RAW' ? 'RAW' : gradingService;
        const gradeLabel = body.isGradeEstimated ? `~${grade}` : grade;
        title = `${gradingLabel} ${gradeLabel} ${sanitizeString(customTitle, 200)}`.trim();

        // Apply manual metal content if provided (for RAW/custom coins)
        if (body.metalPurity !== undefined || body.metalWeightOz !== undefined) {
          // Validate purity is 0-100 (percentage input)
          if (body.metalPurity !== undefined) {
            const purityNum = Number(body.metalPurity);
            if (isNaN(purityNum) || purityNum < 0 || purityNum > 100) {
              throw validationError('metalPurity must be between 0 and 100 (percentage)');
            }
            createData.metalPurity = purityNum / 100; // Convert percentage to decimal
          }
          // Validate weight is positive
          if (body.metalWeightOz !== undefined) {
            const weightNum = Number(body.metalWeightOz);
            if (isNaN(weightNum) || weightNum <= 0) {
              throw validationError('metalWeightOz must be a positive number');
            }
            createData.metalWeightOz = weightNum;
          }
          // Calculate precious metal oz if both provided
          if (createData.metalPurity !== undefined && createData.metalWeightOz !== undefined) {
            createData.preciousMetalOz = calculatePreciousMetalOz(
              createData.metalWeightOz as number,
              createData.metalPurity as number
            );
          }
        }
      }

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
