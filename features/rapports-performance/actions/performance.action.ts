'use server';

import { ActionResponse } from '@/types';
import { IDashboardData, IPerformanceParams } from '@/features/rapports-performance/types/performance.type';
import { performanceAPI } from '@/features/rapports-performance/apis/performance.api';
import { handleApiError } from '@/utils/handle-api-error';

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
    return handleApiError(error, 'Erreur lors de la récupération des données de performance');
  }
};
