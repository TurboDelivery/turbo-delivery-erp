import { PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { apiClientHttp } from '@/lib/api-client-http';
import { SearchParams } from 'ak-api-http';
import { IFacture, IFactureParams, IFactureSummary, IFactureSummaryParams, IFactureDetail } from '../types/facture.types';

export interface IFactureApi {
  obtenirFactures(params?: IFactureParams): Promise<PaginatedResponse<IFacture>>;
  obtenirFacture(id: string): Promise<IFactureDetail>;
  obtenirFacturesParRestaurant(restaurantId?: string, params?: IFactureParams): Promise<PaginatedResponse<IFacture>>;
  obtenirSummaryRecouvrements(params?: IFactureSummaryParams): Promise<IFactureSummary>;
  validerFacture(id: string): Promise<IFacture>;
  recalculerFacture(id: string): Promise<IFacture>;
  reinitialiserFacture(id: string): Promise<void>;
  supprimerFacture(id: string, options?: { motif?: string; supprimerLiee?: boolean }): Promise<void>;
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

  recalculerFacture(id: string): Promise<IFacture> {
    return api.request<IFacture>({
      endpoint: `erp/factures/${id}/recalculer`,
      method: 'POST',
      data: { id },
    });
  },

  // Endpoint porté par FinanceResource (/api/finance) — base `finance`, pas `erp`.
  reinitialiserFacture(id: string): Promise<void> {
    return api.request<void>({
      endpoint: `finance/factures/${id}/reinitialiser`,
      method: 'POST',
      data: { id },
    });
  },

  // Suppression DÉFINITIVE — FinanceResource (/api/finance), base `finance`, pas `erp`.
  //
  // Transport : `apiClientHttp` et non `api`, parce que lui seul pose `X-User-Id`.
  // RG-06 exige que la suppression soit journalisée avec « qui » : le serveur le lit
  // dans cet en-tête, et le journal partait avec un auteur systématiquement vide.
  //
  // `supprimerLiee` tranche le sort de la facture jumelle frais/commission (RG-08) :
  // false conserve l'autre en la désolidarisant, true l'emporte avec celle-ci.
  supprimerFacture(
    id: string,
    options?: { motif?: string; supprimerLiee?: boolean },
  ): Promise<void> {
    return apiClientHttp.request<void>({
      endpoint: `/api/finance/factures/${id}`,
      method: 'DELETE',
      params: {
        ...(options?.motif ? { motif: options.motif } : {}),
        supprimerLiee: options?.supprimerLiee ? 'true' : 'false',
      },
    });
  },
};
