import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types';
import { IPaiement, IPaiementParams, IPaiementStats } from '../types/paiement.type';

// TODO: Remplacer les endpoints par les vrais quand le backend sera prêt
const BASE_ENDPOINT = '/erp/paiements';

export interface IPaiementAPI {
  obtenirPaiements(params: IPaiementParams): Promise<PaginatedResponse<IPaiement>>;
  obtenirStats(mois?: string): Promise<IPaiementStats>;
  initierPaiement(ids: string[], mois: string): Promise<void>;
}

export const paiementAPI: IPaiementAPI = {
  obtenirPaiements(params: IPaiementParams): Promise<PaginatedResponse<IPaiement>> {
    const searchParams: Record<string, string> = {};
    if (typeof params.page === 'number') searchParams['page'] = String(params.page);
    if (typeof params.size === 'number') searchParams['size'] = String(params.size);
    if (params.mois) searchParams['mois'] = params.mois;
    if (params.statut) searchParams['statut'] = params.statut;

    return api.request<PaginatedResponse<IPaiement>>({
      endpoint: `${BASE_ENDPOINT}/pagination`,
      method: 'GET',
      searchParams,
    });
  },

  obtenirStats(mois?: string): Promise<IPaiementStats> {
    const searchParams: Record<string, string> = {};
    if (mois) searchParams['mois'] = mois;

    return api.request<IPaiementStats>({
      endpoint: `${BASE_ENDPOINT}/stats`,
      method: 'GET',
      searchParams,
    });
  },

  initierPaiement(ids: string[], mois: string): Promise<void> {
    return api.request<void>({
      endpoint: `${BASE_ENDPOINT}/initier`,
      method: 'POST',
      data: { ids, mois },
    });
  },
};
