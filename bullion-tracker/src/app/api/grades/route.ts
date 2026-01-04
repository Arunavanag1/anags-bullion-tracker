import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const grades = await prisma.validGrade.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    // Group by category
    const grouped = grades.reduce((acc: Record<string, typeof grades>, grade) => {
      const category = grade.gradeCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(grade);
      return acc;
    }, {});

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Get grades error:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}
