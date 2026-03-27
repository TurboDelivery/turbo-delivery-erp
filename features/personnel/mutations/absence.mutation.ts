'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { absenceAPI } from '@/features/personnel/apis/absence.api';
import { absenceKeys } from '@/features/personnel/queries/absence.query';
import { IAbsencePayload } from '@/features/personnel/types/absence.types';

export const useCreateAbsenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IAbsencePayload) => absenceAPI.ajouterAbsence(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: absenceKeys.all });
      toast.success('Absence enregistree avec succes');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'enregistrement", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useUpdateAbsenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IAbsencePayload }) => absenceAPI.modifierAbsence(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: absenceKeys.all });
      toast.success('Absence modifiee avec succes');
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

