'use server';

import { apiClientHttp } from '@/lib/api-client-http';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Compte d'accès à l'Espace partenaire (demande de coursier). */
export interface IAccesPartenaire {
  id: string;
  email: string;
  nom: string | null;
  role: string;
}

/** Payload de création / réinitialisation d'un accès (upsert par email). */
export interface ICreerAccesPayload {
  email: string;
  password: string;
  nom?: string;
  role?: string;
}

export type AccesActionResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

const serverMessage = (error: any): string => {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  return data?.message || error?.message || 'Erreur inconnue';
};

// ─── Actions ────────────────────────────────────────────────────────────────

/** Liste les comptes d'accès Espace partenaire d'un restaurant. */
export async function listerAccesPartenaire(
  restaurantId: string,
): Promise<AccesActionResult<IAccesPartenaire[]>> {
  try {
    const data = await apiClientHttp.request<IAccesPartenaire[]>({
      endpoint: `/api/erp/demande-coursier/acces/${restaurantId}`,
      method: 'GET',
      service: 'backend',
    });
    return { status: 'success', data: data ?? [] };
  } catch (error: any) {
    return { status: 'error', message: serverMessage(error) };
  }
}

/**
 * Crée un accès Espace partenaire (rôle OWNER par défaut).
 * Upsert par email : sert aussi de réinitialisation de mot de passe.
 */
export async function creerAccesPartenaire(
  restaurantId: string,
  payload: ICreerAccesPayload,
): Promise<AccesActionResult<{ id: string; email: string }>> {
  try {
    const data = await apiClientHttp.request<{ id: string; email: string }>({
      endpoint: `/api/erp/demande-coursier/acces/${restaurantId}`,
      method: 'POST',
      service: 'backend',
      data: payload,
    });
    return { status: 'success', data };
  } catch (error: any) {
    return { status: 'error', message: serverMessage(error) };
  }
}
