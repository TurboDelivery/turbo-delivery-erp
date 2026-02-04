import { PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { IFacture, IFactureParams, IFactureSummary, IFactureSummaryParams } from '../types/facture.types';

export interface IFactureApi {
  obtenirFactures(params?: IFactureParams): Promise<PaginatedResponse<IFacture>>;
  obtenirFacture(id: string): Promise<IFacture>;
  obtenirFacturesParRestaurant(restaurantId?: string, params?: IFactureParams): Promise<PaginatedResponse<IFacture>>;
  obtenirSummaryRecouvrements(params?: IFactureSummaryParams): Promise<IFactureSummary>;
}

export const factureAPI: IFactureApi = {
  obtenirFactures(params?: IFactureParams): Promise<PaginatedResponse<IFacture>> {
    const { periodeDebut = null, periodeFin = null, ...restParams } = params || {};
    const debut = periodeDebut ? new Date(periodeDebut).toISOString().split('T')[0] : undefined;
    const fin = periodeFin ? new Date(periodeFin).toISOString().split('T')[0] : undefined;

    return api.request<PaginatedResponse<IFacture>>({
      endpoint: 'erp/factures',
      method: 'GET',
      searchParams: {
        ...restParams,
        debut: debut,
        fin: fin,
      } as SearchParams,
    });
  },

  obtenirFacture(id: string): Promise<IFacture> {
    return api.request<IFacture>({
      endpoint: `erp/factures/${id}`,
      method: 'GET',
    });
  },

  obtenirFacturesParRestaurant(restaurantId?: string, params?: IFactureParams): Promise<PaginatedResponse<IFacture>> {
    const { periodeDebut = null, periodeFin = null, ...restParams } = params || {};
    const debut = periodeDebut ? new Date(periodeDebut).toISOString().split('T')[0] : undefined;
    const fin = periodeFin ? new Date(periodeFin).toISOString().split('T')[0] : undefined;

    return api.request<PaginatedResponse<IFacture>>({
      endpoint: 'erp/factures',
      method: 'GET',
      searchParams: {
        ...restParams,
        ...(restaurantId && { restaurantId }),
        debut: debut,
        fin: fin,
      } as SearchParams,
    });
  },

  obtenirSummaryRecouvrements(params?: IFactureSummaryParams): Promise<IFactureSummary> {
    return api.request<IFactureSummary>({
      endpoint: 'erp/factures/recouvrements/summary',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },
};
