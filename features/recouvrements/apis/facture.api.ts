import { PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { IFacture, IFactureParams, IFactureSummary, IFactureSummaryParams, IFactureDetail } from '../types/facture.types';

export interface IFactureApi {
  obtenirFactures(params?: IFactureParams): Promise<PaginatedResponse<IFacture>>;
  obtenirFacture(id: string): Promise<IFactureDetail>;
  obtenirFacturesParRestaurant(restaurantId?: string, params?: IFactureParams): Promise<PaginatedResponse<IFacture>>;
  obtenirSummaryRecouvrements(params?: IFactureSummaryParams): Promise<IFactureSummary>;
  validerFacture(id: string): Promise<IFacture>;
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

  obtenirFacture(id: string): Promise<IFactureDetail> {
    return api.request<IFactureDetail>({
      endpoint: `erp/factures/${id}/details`,
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

  validerFacture(id: string): Promise<IFacture> {
    return api.request<IFacture>({
      endpoint: `erp/factures/${id}/valider`,
      method: 'POST',
      data: { id },
    });
  },
};
