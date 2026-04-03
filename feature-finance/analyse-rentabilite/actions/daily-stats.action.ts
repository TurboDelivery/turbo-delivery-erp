'use server';

import { ActionResponse } from '@/types';
import { dailyStatsAPI } from '@/features/analyse-rentabilite/apis/daily-stats.api';
import { IDailyStatsParams, IDailyStatsResponse } from '@/features/analyse-rentabilite/types/daily-stats.type';
import { handleServerActionError } from '@/utils/handleServerActionError';

export const obtenirDailyStatsAction = async (
  params: IDailyStatsParams,
): Promise<ActionResponse<IDailyStatsResponse>> => {
  try {
    const data = await dailyStatsAPI.obtenirDailyStats(params);
    return {
      success: true,
      data,
      message: 'Stats journalières obtenues avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération des stats journalières');
  }
};
