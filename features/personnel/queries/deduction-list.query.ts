'use client';

import { useEffect } from 'react';
import { useQuery , keepPreviousData} from '@tanstack/react-query';
import { deductionAPI } from '@/features/personnel/apis/deduction.api';
import { IDeductionParams } from '@/features/personnel/types/deduction.types';

export const deductionKeys = {
  all: ['deductions'] as const,
  lists: () => [...deductionKeys.all, 'list'] as const,
  list: (params?: IDeductionParams) => [...deductionKeys.lists(), params] as const,
  details: () => [...deductionKeys.all, 'detail'] as const,
  detail: (id: string) => [...deductionKeys.details(), id] as const,
};

export const useDeductionListQuery = (params?: IDeductionParams) => {
  const query = useQuery({
    queryKey: deductionKeys.list(params),
    queryFn: () => deductionAPI.obtenirDeductions(params),
    staleTime: 30_000,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      console.error('Erreur lors de la recuperation des deductions:', query.error);
    }
  }, [query.isError, query.error]);

  return query;
};
