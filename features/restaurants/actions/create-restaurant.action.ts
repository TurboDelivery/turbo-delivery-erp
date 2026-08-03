'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';

/**
 * Le service restaurant renvoie le message brut de Spring, en anglais et sans indiquer la
 * limite : « Maximum upload size exceeded ». Affiché tel quel à un opérateur, il ne dit ni
 * ce qui est trop lourd ni quoi faire. Filet de sécurité — le formulaire arrête normalement
 * l'envoi avant, mais cette traduction couvre les autres chemins d'appel.
 */
function traduireErreur(message: string): string {
  if (/maximum upload size|upload size exceeded|SizeLimitExceeded/i.test(message)) {
    return "Les pièces jointes dépassent la taille acceptée par le serveur (10 Mo au total). "
      + 'Retirez ou remplacez le fichier le plus lourd, puis réessayez.';
  }
  return message;
}

export async function createRestaurant(formData: FormData): Promise<ActionResult<any>> {
  try {
    const entries: Record<string, any> = {};
    formData.forEach((value, key) => {
      const display = value instanceof File ? `[File: ${value.name}, ${value.size}b]` : value;
      if (entries[key] !== undefined) {
        entries[key] = Array.isArray(entries[key]) ? [...entries[key], display] : [entries[key], display];
      } else {
        entries[key] = display;
      }
    });
    console.log('[createRestaurant] payload:', JSON.stringify(entries, null, 2));

    const data = await apiClientHttp.request<any>({
      endpoint: '/api/V1/turbo/restaurant/v2/create',
      method: 'POST',
      data: formData,
      config: {
        baseURL: process.env.NEXT_PUBLIC_API_RESTO_URL,
      },
    });
    return { status: 'success', message: 'Restaurant créé avec succès', data };
  } catch (error: any) {
    const msg = error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || 'Erreur lors de la création du restaurant';
    console.error('[createRestaurant] error:', error?.response?.status, msg);
    return { status: 'error', message: traduireErreur(msg) };
  }
}
