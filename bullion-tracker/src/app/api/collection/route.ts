import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

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
  } catch (error: any) {
    console.error('Error fetching collection items:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch collection items',
      },
      { status: 500 }
    );
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

    // Validate required fields
    const { type, metal, weightOz, bookValueType, spotPriceAtCreation } = body;

    if (!type || !metal || !weightOz || !bookValueType || spotPriceAtCreation === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Build create data object, only including defined fields
    const createData: any = {
      userId,
      type,
      metal,
      quantity: body.quantity || 1,
      weightOz,
      bookValueType,
      spotPriceAtCreation,
    };

    // Add optional fields only if they are defined
    if (body.title !== undefined) createData.title = body.title;
    if (body.grade !== undefined) createData.grade = body.grade;
    if (body.gradingService !== undefined) createData.gradingService = body.gradingService;
    if (body.notes !== undefined) createData.notes = body.notes;
    if (body.customBookValue !== undefined) createData.customBookValue = body.customBookValue;
    if (body.purchaseDate) createData.purchaseDate = new Date(body.purchaseDate);
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
  } catch (error: any) {
    console.error('Error creating collection item:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create collection item',
      },
      { status: 500 }
    );
  }
}
