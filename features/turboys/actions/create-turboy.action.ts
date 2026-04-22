'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';

const BASE_URL = '/api/erp';

export async function createLivreur(formData: FormData): Promise<ActionResult<any>> {
  try {
    const data = await apiClientHttp.request<any>({
      endpoint: `${BASE_URL}/livreur`,
      method: 'POST',
      service: 'backend',
      data: formData,
    });
    return { status: 'success', message: 'Livreur créé avec succès', data };
  } catch (error: any) {
    return {
      status: 'error',
      message: error?.message || 'Erreur lors de la création du livreur',
    };
  }
}
