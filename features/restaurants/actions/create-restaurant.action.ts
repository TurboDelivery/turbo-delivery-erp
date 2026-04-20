'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';

export async function createRestaurant(formData: FormData): Promise<ActionResult<any>> {
  try {
    const data = await apiClientHttp.request<any>({
      endpoint: '/api/V1/turbo/restaurant',
      method: 'POST',
      service: 'restaurant',
      data: formData,
    });
    return { status: 'success', message: 'Restaurant créé avec succès', data };
  } catch (error: any) {
    return {
      status: 'error',
      message: error?.message || 'Erreur lors de la création du restaurant',
    };
  }
}
