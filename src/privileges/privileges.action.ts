'use server';

import { apiClientHttp } from '@/lib/api-client-http';

/**
 * Une DEROGATION d'affichage : ce rôle voit, ou ne voit pas, cet écran.
 *
 * <p>Elle se pose PAR-DESSUS la matrice du code (`ROLE_RULES`). Tant qu'il n'y en a aucune,
 * rien ne change ; en retirer une rend l'écran à son comportement d'origine.</p>
 *
 * <p>⚠ Elle pilote l'AFFICHAGE, pas l'accès. Les contrôleurs `/api/erp` de main-backend ne
 * portent aucun contrôle de rôle : retirer un menu retire ce qu'on voit, pas ce qu'on peut
 * atteindre en connaissant l'adresse. L'écran des privilèges le dit.</p>
 */
export interface Derogation {
  role: string;
  chemin: string;
  autorise: boolean;
}

const BASE = '/api/V1/turbo/erp/privileges';

/**
 * Les dérogations en vigueur.
 *
 * <p>Sur échec on rend une liste VIDE, et c'est délibéré : sans dérogation, l'ERP retombe sur
 * la matrice du code, donc sur le comportement d'avant. Faire tomber la barre de navigation
 * parce qu'une lecture accessoire a échoué serait pire que le défaut qu'elle corrige.</p>
 */
export async function getDerogations(): Promise<Derogation[]> {
  try {
    const data = await apiClientHttp.request<Derogation[]>({
      endpoint: BASE,
      method: 'GET',
      service: 'erp',
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Remplace l'ENSEMBLE des dérogations par celles fournies. */
export async function enregistrerDerogations(
  derogations: Derogation[],
): Promise<{ status: 'error' | 'success'; message: string }> {
  try {
    const data = await apiClientHttp.request<{ message?: string }>({
      endpoint: BASE,
      method: 'PUT',
      data: { derogations },
      service: 'erp',
    });
    return { status: 'success', message: data?.message || 'Privilèges enregistrés' };
  } catch (error: any) {
    return {
      status: 'error',
      message:
        error?.response?.data?.message ||
        error?.response?.data ||
        "Erreur lors de l'enregistrement des privilèges",
    };
  }
}
