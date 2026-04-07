import { api } from '@/lib/api';
import { IFinanceResume, IFinanceResumeParams } from '../types/finance-resume.type';

export interface IFinanceResumeAPI {
  obtenirResume(params: IFinanceResumeParams): Promise<IFinanceResume>;
}

export const financeResumeAPI: IFinanceResumeAPI = {
  obtenirResume(params: IFinanceResumeParams): Promise<IFinanceResume> {
    const searchParams: Record<string, string> = {};
    if (params.debut) searchParams['debut'] = params.debut.toISOString().split('T')[0];
    if (params.fin) searchParams['fin'] = params.fin.toISOString().split('T')[0];

    return api.request<IFinanceResume>({
      endpoint: `/finance/resume`,
      method: 'GET',
      searchParams,
    });
  },
};
