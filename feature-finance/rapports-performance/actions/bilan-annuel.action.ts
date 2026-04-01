'use server';

import { ActionResponse } from '@/types';
import {
  IBilanAnnuelParams,
  IBilanAnnuelResponse,
} from '@/feature-finance/rapports-performance/types/bilan-annuel.type';
import { bilanAnnuelAPI } from '@/feature-finance/rapports-performance/apis/bilan-annuel.api';
import { handleServerActionError } from '@/utils/handleServerActionError';

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
    return handleServerActionError(error, 'Erreur lors de la récupération du bilan annuel');
  }
};
