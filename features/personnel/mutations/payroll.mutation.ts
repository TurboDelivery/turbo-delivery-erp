'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollAPI } from '@/features/personnel/apis/payroll.api';
import { payrollKeys } from '@/features/personnel/queries/payroll.query';
import { IPayPayrollParams } from '@/features/personnel/types/payroll.types';

export const usePayPayrollMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: IPayPayrollParams) => payrollAPI.payerPayroll(params),
    onSuccess: async (_, params) => {
      const month = `${params.annee}-${String(params.mois).padStart(2, '0')}`;
      await queryClient.invalidateQueries({ queryKey: payrollKeys.list({ month }) });
      await queryClient.invalidateQueries({ queryKey: payrollKeys.statsDetails(month) });
    },
  });
};

