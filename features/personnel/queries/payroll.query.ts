'use client';

import { useQuery } from '@tanstack/react-query';
import { payrollAPI } from '@/features/personnel/apis/payroll.api';
import { IPayrollParams } from '@/features/personnel/types/payroll.types';

export const payrollKeys = {
  all: ['payrolls'] as const,
  lists: () => [...payrollKeys.all, 'list'] as const,
  list: (params: IPayrollParams) => [...payrollKeys.lists(), params] as const,
  statsDetails: (month: string) => [...payrollKeys.all, 'stats-details', month] as const,
  pay: () => [...payrollKeys.all, 'pay'] as const,
};

export const usePayrollsQuery = (params: IPayrollParams) => {
  return useQuery({
    queryKey: payrollKeys.list(params),
    queryFn: () => payrollAPI.obtenirTousPayrolls(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const usePayrollStatsDetailsQuery = (month: string) => {
  return useQuery({
    queryKey: payrollKeys.statsDetails(month),
    queryFn: () => payrollAPI.obtenirPayrollStatsDetails(month),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: Boolean(month),
  });
};

