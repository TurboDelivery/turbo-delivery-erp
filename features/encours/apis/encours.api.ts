import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { IEncoursReleve, IEncoursParams, IDeductionPartenaire } from '../types/encours.types';

// Backend : main-backend (service erp). /api/finance/encours, /api/finance/encours/groupes,
// /api/finance/deductions-partenaire.
export const encoursAPI = {
  getReleve(params: IEncoursParams): Promise<IEncoursReleve> {
    return api.request<IEncoursReleve>({
      endpoint: 'finance/encours',
      method: 'GET',
      searchParams: {
        annee: params.annee,
        mois: params.mois ?? undefined,        // omis = « Tous » (cumul annuel)
        partenaire: params.partenaire || undefined,
      } as SearchParams,
    });
  },

  getGroupes(): Promise<string[]> {
    return api.request<string[]>({
      endpoint: 'finance/encours/groupes',
      method: 'GET',
    });
  },

  listerDeductions(annee: number): Promise<IDeductionPartenaire[]> {
    return api.request<IDeductionPartenaire[]>({
      endpoint: 'finance/deductions-partenaire',
      method: 'GET',
      searchParams: { annee } as SearchParams,
    });
  },
};
