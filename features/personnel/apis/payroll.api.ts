import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { IPayroll, IPayrollParams } from '@/features/personnel/types/payroll.types';
import { IDeductionStats } from '@/features/personnel/types/deduction.types';

export interface IPayrollAPI {
  obtenirTousPayrolls(params: IPayrollParams): Promise<IPayroll[]>;
  obtenirPayrollStatsDetails(month: string): Promise<IDeductionStats>;
}

export const payrollAPI: IPayrollAPI = {
  obtenirTousPayrolls(params: IPayrollParams): Promise<IPayroll[]> {
    return api.request<IPayroll[]>({
      endpoint: 'erp/payrolls/all',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  obtenirPayrollStatsDetails(month: string): Promise<IDeductionStats> {
    return api.request<IDeductionStats>({
      endpoint: '/erp/payrolls/stats/details',
      method: 'GET',
      searchParams: { month } as SearchParams,
    });
  },
};

