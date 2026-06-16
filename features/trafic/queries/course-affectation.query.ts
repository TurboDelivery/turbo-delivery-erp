'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { assignCourseExterne, getPaginationCourseExterneEnAttente } from '@/src/actions/courses.actions';
import { traficKeyQuery } from '@/features/trafic/queries/index.query';

export const COURSES_EN_ATTENTE_KEY = ['trafic', 'courses-en-attente'] as const;

/** Courses EN_ATTENTE à affecter depuis la carte (M4, §5.4). */
export const useCoursesEnAttenteQuery = (enabled: boolean) =>
  useQuery({
    queryKey: COURSES_EN_ATTENTE_KEY,
    queryFn: () => getPaginationCourseExterneEnAttente(0, 50),
    enabled,
    staleTime: 15 * 1000,
  });

/** Affectation d'une course à un livreur (réutilise PUT /api/erp/course-externe). */
export const useAssignerCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, livreurId, frais }: { courseId: string; livreurId: string; frais: number }) =>
      assignCourseExterne(courseId, livreurId, frais),
    onSuccess: (result) => {
      if (result?.status === 'success') {
        toast.success(result.message ?? 'Course affectée');
        queryClient.invalidateQueries({ queryKey: traficKeyQuery('livreurs') });
        queryClient.invalidateQueries({ queryKey: COURSES_EN_ATTENTE_KEY });
      } else {
        toast.error(result?.message ?? "Échec de l'affectation");
      }
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error("Échec de l'affectation", { description });
    },
  });
};
