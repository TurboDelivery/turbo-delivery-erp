'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';

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
    return { status: 'error', message: msg };
  }
}
