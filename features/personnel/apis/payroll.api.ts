import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { IPayroll, IPayrollParams, IPayPayrollParams } from '@/features/personnel/types/payroll.types';
import { IDeductionStats } from '@/features/personnel/types/deduction.types';

export interface IPayrollAPI {
  obtenirTousPayrolls(params: IPayrollParams): Promise<IPayroll[]>;
  obtenirPayrollStatsDetails(month: string): Promise<IDeductionStats>;
  payerPayroll(params: IPayPayrollParams): Promise<IPayroll>;
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

  payerPayroll(params: IPayPayrollParams): Promise<IPayroll> {
    return api.request<IPayroll>({
      endpoint: 'erp/paiements-salaires',
      method: 'POST',
      data: params,
    });
  },
};

