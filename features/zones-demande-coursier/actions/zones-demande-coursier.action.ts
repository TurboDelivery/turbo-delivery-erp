'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';
import { ZoneTarifHistorique } from '../types/zone-demande-coursier.types';

const BASE_URL = '/api/erp/demande-coursier/zones';

export async function updateZoneActif(fraisId: string, actif: boolean): Promise<ActionResult<null>> {
  try {
    await apiClientHttp.request({
      endpoint: `${BASE_URL}/${fraisId}/actif`,
      method: 'PUT',
      data: { actif },
      service: 'backend',
    });

    return {
      status: 'success',
      data: null,
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: error?.response?.data?.message ?? 'Une erreur est survenue',
    };
  }
}

export async function getZoneHistorique(fraisId: string): Promise<ZoneTarifHistorique[] | null> {
  try {
    const data = await apiClientHttp.request<ZoneTarifHistorique[]>({
      endpoint: `${BASE_URL}/${fraisId}/historique`,
      method: 'GET',
      service: 'backend',
    });

    return data ?? [];
  } catch (error: any) {
    return null;
  }
}
