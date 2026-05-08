'use server';

import { ActionResponse } from '@/types';
import {
  IBilanAnnuelParams,
  IBilanAnnuelResponse,
} from '@/features/rapports-performance/types/bilan-annuel.type';
import { bilanAnnuelAPI } from '@/features/rapports-performance/apis/bilan-annuel.api';
import { handleApiError } from '@/utils/handle-api-error';

export const obtenirBilanAnnuelAction = async (
  params: IBilanAnnuelParams,
): Promise<ActionResponse<IBilanAnnuelResponse>> => {
  try {
    const data = await bilanAnnuelAPI.obtenirBilanAnnuel(params);
    return {
      success: true,
      data,
      message: 'Bilan annuel obtenu avec succès',
    };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la récupération du bilan annuel');
  }
};
