import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types/general';
import {
  IAccepterAppel,
  IAppelConfig,
  IAppelEnCours,
  IAppelEntrant,
  IAppelLog,
  IAppelSession,
  IChangerStatutIncident,
  ICreerMotifIncident,
  IIncident,
  IIncidentMotif,
  IInitierAppel,
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

  /** Appels entrants SONNE vers STANDARD (repli de signalisation, pollé par la console). */
  listerAppelsEntrants(): Promise<IAppelEntrant[]> {
    return apiClientHttp.request<IAppelEntrant[]>({
      endpoint: '/api/erp/appel/entrants',
      method: 'GET',
    });
  },

  /** Configuration du groupe de réponse (rôles qui sonnent). */
  getAppelConfig(): Promise<IAppelConfig> {
    return apiClientHttp.request<IAppelConfig>({
      endpoint: '/api/erp/appel/config',
      method: 'GET',
    });
  },

  /** Met à jour les rôles répondants (≥ 1 requis) et superviseurs. */
  modifierAppelConfig(dto: IAppelConfig): Promise<IAppelConfig> {
    return apiClientHttp.request<IAppelConfig>({
      endpoint: '/api/erp/appel/config',
      method: 'PUT',
      data: dto,
    });
  },

  /** Appels EN COURS (supervision). */
  listerAppelsEnCours(): Promise<IAppelEnCours[]> {
    return apiClientHttp.request<IAppelEnCours[]>({
      endpoint: '/api/erp/appel/en-cours',
      method: 'GET',
    });
  },

  /** Rejoint un appel en cours pour l'écouter (renvoie un token d'écoute). */
  superviserAppel(id: string, dto: { superviseurId: string; superviseurNom: string }): Promise<IAppelSession> {
    return apiClientHttp.request<IAppelSession>({
      endpoint: `/api/erp/appel/${id}/superviser`,
      method: 'POST',
      data: dto,
    });
  },

  // ─── Appel audio in-app (LUNION Meet) ────────────────────────────────────────

  /** STANDARD initie un appel audio in-app vers un livreur. Renvoie token + url. */
  initierAppel(dto: IInitierAppel): Promise<IAppelSession> {
    return apiClientHttp.request<IAppelSession>({
      endpoint: '/api/erp/appel/initier',
      method: 'POST',
      data: dto,
    });
  },

  /** Un agent STANDARD décroche un appel entrant (livreur → STANDARD). */
  accepterAppel(id: string, dto: IAccepterAppel): Promise<IAppelSession> {
    return apiClientHttp.request<IAppelSession>({
      endpoint: `/api/erp/appel/${id}/accepter`,
      method: 'POST',
      data: dto,
    });
  },

  /** Refuse un appel entrant. */
  rejeterAppel(id: string): Promise<void> {
    return apiClientHttp.request<void>({ endpoint: `/api/erp/appel/${id}/rejeter`, method: 'POST' });
  },

  /** Raccroche un appel en cours. */
  raccrocherAppel(id: string): Promise<void> {
    return apiClientHttp.request<void>({ endpoint: `/api/erp/appel/${id}/raccrocher`, method: 'POST' });
  },

  /** Annule un appel sortant avant décrochage. */
  annulerAppel(id: string): Promise<void> {
    return apiClientHttp.request<void>({ endpoint: `/api/erp/appel/${id}/annuler`, method: 'POST' });
  },
};
