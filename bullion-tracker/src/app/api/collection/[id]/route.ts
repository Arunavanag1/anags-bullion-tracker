import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/collection/[id]
 * Get a single collection item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    const item = await prisma.collectionItem.findUnique({
      where: {
        id,
        userId, // Ensure user can only access their own items
      },
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('Error fetching collection item:', error);

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
        error: 'Failed to fetch collection item',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/collection/[id]
 * Update a collection item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await request.json();

    // Verify ownership before updating
    const existingItem = await prisma.collectionItem.findUnique({
      where: { id },
    });

    if (!existingItem || existingItem.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found',
        },
        { status: 404 }
      );
    }

    // Build update data object, only including defined fields
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.metal !== undefined) updateData.metal = body.metal;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.weightOz !== undefined) updateData.weightOz = body.weightOz;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.gradingService !== undefined) updateData.gradingService = body.gradingService;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.bookValueType !== undefined) updateData.bookValueType = body.bookValueType;
    if (body.customBookValue !== undefined) updateData.customBookValue = body.customBookValue;
    if (body.purchaseDate) updateData.purchaseDate = new Date(body.purchaseDate);

    // Handle images: delete all existing and create new ones
    if (body.images && body.images.length > 0) {
      updateData.images = {
        deleteMany: {},
        create: body.images.map((url: string, index: number) => ({
          url,
          order: index,
        })),
      };
    }

    const item = await prisma.collectionItem.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating collection item:', error);

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
        error: 'Failed to update collection item',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collection/[id]
 * Delete a collection item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    // Verify ownership before deleting
    const existingItem = await prisma.collectionItem.findUnique({
      where: { id },
    });

    if (!existingItem || existingItem.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found',
        },
        { status: 404 }
      );
    }

    await prisma.collectionItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting collection item:', error);

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
        error: 'Failed to delete collection item',
      },
      { status: 500 }
    );
  }
}
