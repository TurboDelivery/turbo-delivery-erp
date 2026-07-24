import { apiClientHttp } from '@/lib/api-client-http';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Résumé d'intégration d'un restaurant (identité + clé API partenaire). */
export interface IIntegrationRestaurant {
  restaurantId: string;
  nomEtablissement: string;
  apiKey: string | null;
}

/** Webhook sortant configuré pour un restaurant (Turbo → solution partenaire). */
export interface IWebhook {
  id: string;
  url: string;
  description: string | null;
  restaurantId: string;
  createdAt: string;
}

/** Une ligne du journal d'intégration (appel réseau entrant ou sortant). */
export interface IIntegrationLog {
  id: string;
  restaurantId: string | null;
  direction: 'ENTRANT' | 'SORTANT';
  evenement: string;
  url: string | null;
  methode: string | null;
  requete: string | null;
  reponseStatut: number | null;
  reponseCorps: string | null;
  succes: boolean;
  erreur: string | null;
  createdAt: string;
}

/** Enveloppe de pagination Spring Data. */
export interface IPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface IIntegrationLogsParams {
  restaurantId?: string;
  direction?: 'ENTRANT' | 'SORTANT';
  succes?: boolean;
  page?: number;
  size?: number;
}

// ─── Clé API ────────────────────────────────────────────────────────────────

export async function getCleApiApi(restaurantId: string): Promise<IIntegrationRestaurant> {
  return apiClientHttp.request<IIntegrationRestaurant>({
    endpoint: `/api/erp/integration/restaurants/${restaurantId}/cle-api`,
    method: 'GET',
  });
}

// ─── Journal des appels réseau ────────────────────────────────────────────────

export async function getIntegrationLogsApi(
  params: IIntegrationLogsParams,
): Promise<IPage<IIntegrationLog>> {
  return apiClientHttp.request<IPage<IIntegrationLog>>({
    endpoint: `/api/erp/integration/logs`,
    method: 'GET',
    params: {
      restaurantId: params.restaurantId,
      direction: params.direction,
      succes: params.succes,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

// ─── Webhooks (CRUD) ──────────────────────────────────────────────────────────

export async function listerWebhooksApi(restaurantId: string): Promise<IWebhook[]> {
  return apiClientHttp.request<IWebhook[]>({
    endpoint: `/api/v1/notifications-webhooks/lister/${restaurantId}`,
    method: 'GET',
  });
}

export async function enregistrerWebhookApi(payload: {
  restaurantId: string;
  url: string;
  description?: string;
}): Promise<string> {
  return apiClientHttp.request<string>({
    endpoint: `/api/v1/notifications-webhooks/enregistrer`,
    method: 'POST',
    data: payload,
  });
}

export async function modifierWebhookApi(
  id: string,
  payload: { url: string; description?: string },
): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/v1/notifications-webhooks/modifier/${id}`,
    method: 'PUT',
    data: payload,
  });
}

export async function supprimerWebhookApi(id: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/v1/notifications-webhooks/${id}`,
    method: 'DELETE',
  });
}
