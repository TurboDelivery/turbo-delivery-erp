import { ActionResponse, PaginatedResponse } from '@/types';
import { IRegularisationTicket, IRegularisationParams } from '@/features/validation-tickets/regularisation/types/regularisation.type';
import { regularisationAPI } from '@/features/validation-tickets/regularisation/apis/regularisation.api';
import { handleServerActionError } from '@/utils/handleServerActionError';

// TODO: activer quand l'endpoint est disponible
export const listerRegularisationMutation = async (
  params: IRegularisationParams,
): Promise<ActionResponse<PaginatedResponse<IRegularisationTicket>>> => {
  try {
    const data = await regularisationAPI.listerTickets(params);
    return { success: true, data, message: 'Tickets régularisation récupérés avec succès' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération des tickets en régularisation');
  }
};

// TODO: activer quand l'endpoint est disponible
export const approuverRegularisationMutation = async (id: string): Promise<ActionResponse<void>> => {
  try {
    await regularisationAPI.approuver(id);
    return { success: true, data: undefined, message: 'Ticket approuvé' };
  } catch (error) {
    return handleServerActionError(error, "Erreur lors de l'approbation");
  }
};

// TODO: activer quand l'endpoint est disponible
export const rejeterRegularisationMutation = async (id: string): Promise<ActionResponse<void>> => {
  try {
    await regularisationAPI.rejeter(id);
    return { success: true, data: undefined, message: 'Ticket rejeté' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors du rejet');
  }
};
