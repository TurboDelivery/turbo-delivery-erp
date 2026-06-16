import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types/general';
import {
  IAppelLog,
  IChangerStatutIncident,
  ICreerMotifIncident,
  IIncident,
  IIncidentMotif,
  IModifierMotifIncident,
  StatutIncident,
} from '../types/standard.types';

// Backend : main-backend, routes /api/erp/** (permitAll). Traçabilité via header X-User-Id.
// On réutilise apiClientHttp sans `service` (baseURL = NEXT_PUBLIC_API_BACKEND_URL),
// comme le module créneaux (cf. features/creneaux/apis/creneau.api.ts).

export const standardAPI = {
  /** File d'incidents paginée, filtrable par statut. */
  listerIncidents(params: { statut?: StatutIncident; page?: number; size?: number }): Promise<PaginatedResponse<IIncident>> {
    return apiClientHttp.request<PaginatedResponse<IIncident>>({
      endpoint: '/api/erp/incident',
      method: 'GET',
      params: {
        page: String(params.page ?? 0),
        size: String(params.size ?? 20),
        ...(params.statut ? { statut: params.statut } : {}),
      },
    });
  },

  /** Détail d'un incident. */
  detailIncident(id: string): Promise<IIncident> {
    return apiClientHttp.request<IIncident>({
      endpoint: `/api/erp/incident/${id}`,
      method: 'GET',
    });
  },

  /** Transition de statut + commentaire ; X-User-Id = traitePar. */
  changerStatut(id: string, dto: IChangerStatutIncident, userId: string): Promise<IIncident> {
    return apiClientHttp.request<IIncident>({
      endpoint: `/api/erp/incident/${id}/statut`,
      method: 'PATCH',
      data: dto,
      config: { headers: { 'X-User-Id': userId } },
    });
  },

  /** Compteur d'incidents ouverts (RECU + EN_COURS). */
  compterOuverts(): Promise<{ ouverts: number }> {
    return apiClientHttp.request<{ ouverts: number }>({
      endpoint: '/api/erp/incident/stats/ouverts',
      method: 'GET',
    });
  },

  // ─── Administration des motifs ─────────────────────────────────────────────

  listerMotifs(): Promise<IIncidentMotif[]> {
    return apiClientHttp.request<IIncidentMotif[]>({
      endpoint: '/api/erp/incident/motifs',
      method: 'GET',
    });
  },

  creerMotif(dto: ICreerMotifIncident): Promise<IIncidentMotif> {
    return apiClientHttp.request<IIncidentMotif>({
      endpoint: '/api/erp/incident/motifs',
      method: 'POST',
      data: dto,
    });
  },

  modifierMotif(code: string, dto: IModifierMotifIncident): Promise<IIncidentMotif> {
    return apiClientHttp.request<IIncidentMotif>({
      endpoint: `/api/erp/incident/motifs/${code}`,
      method: 'PATCH',
      data: dto,
    });
  },

  // ─── Appels ────────────────────────────────────────────────────────────────

  /** Historique paginé des appels. */
  listerAppels(params: { page?: number; size?: number }): Promise<PaginatedResponse<IAppelLog>> {
    return apiClientHttp.request<PaginatedResponse<IAppelLog>>({
      endpoint: '/api/erp/appel',
      method: 'GET',
      params: { page: String(params.page ?? 0), size: String(params.size ?? 20) },
    });
  },
};
