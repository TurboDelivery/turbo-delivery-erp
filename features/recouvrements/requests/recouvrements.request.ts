import { ActionResponse, PaginatedResponse } from '@/types';
import { IRestaurantRecouvrement, IRestaurantRecouvrementSearchParams } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import { handleApiError } from '@/utils/handle-api-error';
import { recouvrementAPI } from '@/features/recouvrements/apis/recouvrement.api';

export const obtenirRestaurantRecouvrementsRequest = async (params: IRestaurantRecouvrementSearchParams): Promise<ActionResponse<PaginatedResponse<IRestaurantRecouvrement>>> => {
  try {
    const response = await recouvrementAPI.obtenirRestaurantRecouvrements(params);
    return {
      success: true,
      data: response,
      message: 'Categories dépenses obtenues avec succès',
    };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la récupération des categories dépenses');
  }
};
