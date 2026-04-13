import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creneauAPI } from '../apis/creneau.api';

export const useInvalidateCreneauQuery = () => {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: ['creneaux'],
      exact: false,
    });
  };
};

export const useJustifierAbsenceMutation = () => {
  const invalidate = useInvalidateCreneauQuery();
  return useMutation({
    mutationFn: ({ id, date, motif }: { id: string; date: string; motif: string }) =>
      creneauAPI.justifierAbsence(id, { date, motif }),
    onSuccess: () => invalidate(),
  });
};

export const useAccuserRetardMutation = () => {
  const invalidate = useInvalidateCreneauQuery();
  return useMutation({
    mutationFn: ({ id, date, motif }: { id: string; date: string; motif: string }) =>
      creneauAPI.accuserRetard(id, { date, motif }),
    onSuccess: () => invalidate(),
  });
};
