import { api } from '@/lib/api';
import type { SearchParams } from 'ak-api-http';
import type { ICaissierConfirmationBody, ICaissierParams, IDepotBanqueCaissierBody, IFactureCaissierListResponse } from '../types';

export const caissierAPI = {
  obtenirFactures(params?: ICaissierParams): Promise<IFactureCaissierListResponse> {
    return api.request<IFactureCaissierListResponse>({
      endpoint: 'finance/responsable-financier/factures',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  /**
   * Ajoute la référence de la fiche de paiement.
   * Nécessite statut = 'Versé au caissier' ou 'Rejeté DGA'.
   * Transitions : 'Versé au caissier' → 'En attente visa DGA'.
   */
  confirmerReception(
    id: string,
    body: ICaissierConfirmationBody,
  ): Promise<{ id: string; statut: string }> {
    return api.request({
      endpoint: `finance/responsable-financier/factures/${id}/preuve`,
      method: 'PATCH',
      data: { reference: body.reference },
    });
  },

  /**
   * Enregistre le dépôt bancaire des fonds.
   * Nécessite statut = 'Visé DGA'.
   * Transitions : 'Visé DGA' → 'Clôturé'.
   */
  depotBanque(
    id: string,
    body: IDepotBanqueCaissierBody,
  ): Promise<{ id: string; statut: string }> {
    return api.request({
      endpoint: `finance/responsable-financier/factures/${id}/depot-banque`,
      method: 'PATCH',
      data: { date: body.date },
    });
  },
};
