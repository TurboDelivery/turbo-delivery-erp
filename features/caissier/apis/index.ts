import { api } from '@/lib/api';
import type { SearchParams } from 'ak-api-http';
import type { ICaissierConfirmationBody, ICaissierParams, IDepotBanqueCaissierBody, IFactureCaissierListResponse, IFactureStatsParStatut } from '../types';

export const caissierAPI = {
  obtenirFactures(params?: ICaissierParams): Promise<IFactureCaissierListResponse> {
    return api.request<IFactureCaissierListResponse>({
      endpoint: 'finance/responsable-financier/factures',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  /**
   * Compteurs et montants groupés par statut, calculés par le SERVEUR sur tout le
   * périmètre filtré.
   *
   * <p>Les cartes de l'écran Caissier se calculaient sur la page de 200 factures
   * déjà chargée. Le cycle en compte 856 : elles affichaient donc au mieux un quart
   * de la réalité, sur un écran financier. Compter juste depuis le client aurait
   * exigé une requête par statut, et chaque requête de cette famille déclenche côté
   * serveur un appel HTTP au service utilisateurs — d'où cet agrégat, en un passage.</p>
   */
  obtenirStatsParStatut(params?: ICaissierParams): Promise<IFactureStatsParStatut> {
    return api.request<IFactureStatsParStatut>({
      endpoint: 'finance/responsable-financier/factures/stats-par-statut',
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
      data: {
        date: body.date,
        numeroBordereau: body.numeroBordereau,
        preuveBordereau: body.preuveBordereau,
        banqueAgence: body.banqueAgence,
        montantDepose: body.montantDepose,
      },
    });
  },
};
