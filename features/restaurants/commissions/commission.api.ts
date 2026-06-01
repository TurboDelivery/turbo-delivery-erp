import { apiClientHttp } from '@/lib/api-client-http';
import {
  IAppliquerCommissionResponse,
  ICommissionVersion,
  IModifierCommissionPayload,
} from './commission.types';

const BASE = '/api/V1/turbo/restaurant';

/**
 * API d'historisation des commissions. Routes sous `/api/V1/turbo/restaurant/**`
 * (service `restaurant` → main-backend), déjà whitelistées : identité portée par
 * le header `X-User-Id` (pas de token JWT).
 */
export const commissionAPI = {
  historique(restaurantId: string): Promise<ICommissionVersion[]> {
    return apiClientHttp.request<ICommissionVersion[]>({
      endpoint: `${BASE}/${restaurantId}/commissions/historique`,
      method: 'GET',
      service: 'restaurant',
    });
  },

  modifier(
    restaurantId: string,
    payload: IModifierCommissionPayload,
    userId?: string,
  ): Promise<IAppliquerCommissionResponse> {
    return apiClientHttp.request<IAppliquerCommissionResponse>({
      endpoint: `${BASE}/${restaurantId}/commissions`,
      method: 'POST',
      service: 'restaurant',
      data: payload,
      config: userId ? { headers: { 'X-User-Id': userId } } : undefined,
    });
  },
};
