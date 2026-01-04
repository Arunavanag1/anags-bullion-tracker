import { useQuery } from '@tanstack/react-query';

export interface ValidGrade {
  id: string;
  gradeCode: string;
  numericValue: number;
  gradeCategory: string;
  displayOrder: number;
}

export type GradesByCategory = Record<string, ValidGrade[]>;

export function useGrades() {
  return useQuery<GradesByCategory>({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await fetch('/api/grades');
      if (!res.ok) throw new Error('Failed to fetch grades');
      return res.json();
    },
  });
}
