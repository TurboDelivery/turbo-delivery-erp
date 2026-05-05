'use server';

import { auth } from '@/auth';
import { ActionResponse, PaginatedResponse } from '@/types';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { StatutControle } from '@/types/statut-controle.enum';
import {
  listerTicketsParStatutRequest,
  approuverTicketRequest,
  rejeterFraudeRequest,
} from '@/features/tickets/request/tickets.request';
import { handleServerActionError } from '@/utils/handleServerActionError';

export const listerRegularisationMutation = async (): Promise<ActionResponse<PaginatedResponse<BonLivraisonTerminee>>> => {
  try {
    const data = await listerTicketsParStatutRequest({ statuts: [StatutControle.TARDIF] });
    return { success: true, data, message: 'Tickets en retard récupérés' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération des tickets en retard');
  }
};

export const approuverRegularisationMutation = async (id: string): Promise<ActionResponse<void>> => {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await approuverTicketRequest(id, userId);
    return { success: true, data: undefined, message: 'Ticket approuvé' };
  } catch (error) {
    return handleServerActionError(error, "Erreur lors de l'approbation");
  }
};

export const rejeterRegularisationMutation = async (id: string, motif: string): Promise<ActionResponse<void>> => {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await rejeterFraudeRequest(id, userId, motif);
    return { success: true, data: undefined, message: 'Ticket rejeté' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors du rejet');
  }
};
