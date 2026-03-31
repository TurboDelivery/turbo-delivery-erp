'use server';

import { ActionResponse } from '@/types';
import { IDashboardData, IPerformanceParams } from '@/feature-finance/rapports-performance/types/performance.type';
import { performanceAPI } from '@/feature-finance/rapports-performance/apis/performance.api';
import { handleServerActionError } from '@/utils/handleServerActionError';

export const obtenirPerformanceAction = async (
  params: IPerformanceParams,
): Promise<ActionResponse<IDashboardData>> => {
  try {
    const data = await performanceAPI.obtenirPerformance(params);
    return {
      success: true,
      data,
      message: 'Données de performance obtenues avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération des données de performance');
  }
};
