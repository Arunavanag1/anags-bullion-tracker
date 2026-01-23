import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const grades = await prisma.validGrade.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    // Return as array wrapped in data property (mobile app expects this format)
    return NextResponse.json({ data: grades });
  } catch (error) {
    console.error('Get grades error:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}
