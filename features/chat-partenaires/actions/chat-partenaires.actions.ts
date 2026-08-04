'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import {
  IConsignerAppelDTO,
  IEnvoyerMessageDTO,
  IMessagePartenaire,
  INonLuPartenaire,
} from '../types/chat-partenaires.types';

// Backend : main-backend (service 'backend'), routes /api/erp/demande-coursier/**.
// X-User-Id est posé automatiquement par apiClientHttp (session next-auth).

const BASE = '/api/erp/demande-coursier';

/** Compteurs de messages non lus côté STANDARD, par partenaire. */
export async function listerNonLusAction(): Promise<INonLuPartenaire[]> {
  return apiClientHttp.request<INonLuPartenaire[]>({
    endpoint: `${BASE}/messages/non-lus`,
    method: 'GET',
    service: 'backend',
  });
}

/** Fil de conversation d'un partenaire, paginé, trié du plus récent au plus ancien. */
export async function listerMessagesAction(restaurantId: string, page = 0): Promise<IMessagePartenaire[]> {
  return apiClientHttp.request<IMessagePartenaire[]>({
    endpoint: `${BASE}/messages/${restaurantId}`,
    method: 'GET',
    params: { page: String(page) },
    service: 'backend',
  });
}

/** Envoie un message STANDARD → partenaire. */
export async function envoyerMessageAction(
  restaurantId: string,
  dto: IEnvoyerMessageDTO,
): Promise<IMessagePartenaire> {
  return apiClientHttp.request<IMessagePartenaire>({
    endpoint: `${BASE}/messages/${restaurantId}`,
    method: 'POST',
    data: dto,
    service: 'backend',
  });
}

/** Marque comme lus, côté STANDARD, tous les messages du partenaire. */
export async function marquerLusAction(restaurantId: string): Promise<void> {
  await apiClientHttp.request<void>({
    endpoint: `${BASE}/messages/${restaurantId}/marquer-lus`,
    method: 'POST',
    service: 'backend',
  });
}

/** Consigne un appel téléphonique passé au partenaire (abouti ou manqué). */
export async function consignerAppelAction(
  restaurantId: string,
  dto: IConsignerAppelDTO,
): Promise<void> {
  await apiClientHttp.request<void>({
    endpoint: `${BASE}/appels/${restaurantId}`,
    method: 'POST',
    data: dto,
    service: 'backend',
  });
}
