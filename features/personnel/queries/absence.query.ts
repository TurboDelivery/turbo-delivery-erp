'use client';

import { useQuery } from '@tanstack/react-query';
import { absenceAPI } from '@/features/personnel/apis/absence.api';
import { IAbsenceParams } from '@/features/personnel/types/absence.types';

export const absenceKeys = {
  all: ['absences'] as const,
  lists: () => [...absenceKeys.all, 'list'] as const,
  list: (params?: IAbsenceParams) => [...absenceKeys.lists(), params] as const,
};

export const useAbsencesQuery = (params?: IAbsenceParams) => {
  return useQuery({
    queryKey: absenceKeys.list(params),
    queryFn: () => absenceAPI.obtenirAbsences(params),
    staleTime: 5 * 60 * 1000,
    enabled:false,
  });
};

