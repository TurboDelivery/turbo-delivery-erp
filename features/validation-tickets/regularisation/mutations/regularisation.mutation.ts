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
    /*
     * `size` explicite : sans lui, `listerTicketsParStatutRequest` retombe sur
     * page 0 / size 50 (tickets.request.ts:205-206). La file n'affichait donc jamais
     * plus de 50 tickets, et son compteur, calcule sur `content.length`, annonçait 50
     * quel qu'en soit le nombre reel. Une file qui ment sur sa propre taille laisse
     * croire le travail fini.
     */
    const data = await listerTicketsParStatutRequest({ statuts: [StatutControle.TARDIF], page: 0, size: 500 });
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

export interface ListerTicketsParStatutCreneauParams {
  statut: StatutControle;
  debut?: string;
  fin?: string;
  page?: number;
  size?: number;
}

export const listerTicketsParStatutCreneauMutation = async (
  params: ListerTicketsParStatutCreneauParams,
): Promise<ActionResponse<PaginatedResponse<BonLivraisonTerminee>>> => {
  try {
    const data = await listerTicketsParStatutRequest({
      statuts: [params.statut],
      debut: params.debut,
      fin: params.fin,
      page: params.page,
      size: params.size,
    });
    return { success: true, data, message: 'Tickets récupérés' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération des tickets');
  }
};
