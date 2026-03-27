'use client';

import { useQuery } from '@tanstack/react-query';
import { deductionAPI } from '@/features/personnel/apis/deduction.api';
import { IDeductionParams } from '@/features/personnel/types/deduction.types';

export const deductionKeys = {
  all: ['deductions'] as const,
  lists: () => [...deductionKeys.all, 'list'] as const,
  list: (params?: IDeductionParams) => [...deductionKeys.lists(), params] as const,
};

export const useDeductionListQuery = (params?: IDeductionParams) => {
  return useQuery({
    queryKey: deductionKeys.list(params),
    queryFn: () => deductionAPI.obtenirDeductions(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
