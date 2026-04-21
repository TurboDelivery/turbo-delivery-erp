'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';

export async function updateRestaurant(id: string, data: FormData): Promise<ActionResult<any>> {
  try {
    const result = await apiClientHttp.request<any>({
      endpoint: `/api/V1/turbo/restaurant/v2/update`,
      method: 'PUT',
      service: 'restaurant',
      params: { restoId: id },
      data,
    });
    console.log('✅ Mise à jour restaurant response:', result);
    return { status: 'success', message: 'Restaurant mis à jour avec succès', data: result };
  } catch (error: any) {
    return {
      status: 'error',
      message: error?.response?.data?.message || error?.message || 'Erreur lors de la mise à jour',
    };
  }
}
