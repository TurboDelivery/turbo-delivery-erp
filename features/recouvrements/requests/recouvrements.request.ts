import { ActionResponse, PaginatedResponse } from '@/types';
import { IRestaurantRecouvrement, IRestaurantRecouvrementSearchParams } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import { handleServerActionError } from '@/utils/handleServerActionError';
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
    return handleServerActionError(error, 'Erreur lors de la récupération des categories dépenses');
  }
};
