'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';

export async function updateLivreur(id: string, formData: FormData): Promise<ActionResult<any>> {
  try {
    const data = await apiClientHttp.request<any>({
      endpoint: `/api/erp/livreur/${id}`,
      method: 'PUT',
      service: 'backend',
      data: formData,
    });
    console.log('✅ Mise à jour livreur response:', data);
    return { status: 'success', message: 'Livreur mis à jour avec succès', data };
  } catch (error: any) {
    return {
      status: 'error',
      message: error?.response?.data?.message || error?.message || 'Erreur lors de la mise à jour du livreur',
    };
  }
}
