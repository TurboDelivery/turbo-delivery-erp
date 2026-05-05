import { ActionResponse, PaginatedResponse } from '@/types';
import { ITicketV2, ITicketsV2Params } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { ticketsV2API } from '@/features/validation-tickets/verrouillage-v2/apis/tickets-v2.api';
import { handleServerActionError } from '@/utils/handleServerActionError';

// TODO: activer quand l'endpoint est disponible
export const listerTicketsV2Mutation = async (
  params: ITicketsV2Params,
): Promise<ActionResponse<PaginatedResponse<ITicketV2>>> => {
  try {
    const data = await ticketsV2API.listerTickets(params);
    return { success: true, data, message: 'Tickets V2 récupérés avec succès' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération des tickets V2');
  }
};

// TODO: activer quand l'endpoint est disponible
export const verrouillerTicketMutation = async (id: string): Promise<ActionResponse<void>> => {
  try {
    await ticketsV2API.verrouiller(id);
    return { success: true, data: undefined, message: 'Ticket verrouillé' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors du verrouillage');
  }
};

// TODO: activer quand l'endpoint est disponible
export const verrouillerTousMutation = async (): Promise<ActionResponse<void>> => {
  try {
    await ticketsV2API.verrouillerTous();
    return { success: true, data: undefined, message: 'Tous les tickets verrouillés' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors du verrouillage global');
  }
};

// TODO: activer quand l'endpoint est disponible
export const deverrouillerTicketMutation = async (id: string): Promise<ActionResponse<void>> => {
  try {
    await ticketsV2API.deverrouiller(id);
    return { success: true, data: undefined, message: 'Ticket déverrouillé' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors du déverrouillage');
  }
};
