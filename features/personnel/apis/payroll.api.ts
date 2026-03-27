import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { IPayroll, IPayrollParams } from '@/features/personnel/types/payroll.types';

export interface IPayrollAPI {
  obtenirTousPayrolls(params: IPayrollParams): Promise<IPayroll[]>;
}

export const payrollAPI: IPayrollAPI = {
  obtenirTousPayrolls(params: IPayrollParams): Promise<IPayroll[]> {
    return api.request<IPayroll[]>({
      endpoint: 'erp/payrolls/all',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },
};

