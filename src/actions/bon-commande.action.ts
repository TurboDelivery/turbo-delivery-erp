'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types';
import { BonLivraison, BonLivraisonTerminee, ParametreBonLivraisonFacture, Ticket } from '@/types/bon-livraison.model';
import { formatDate } from '@/utils/date-formate';
import { RangeValue } from '@heroui/react';
import axios from 'axios';
import { ApiResult } from '@/types/general';
import { handleApiError } from '@/utils/handle-api-error';
import { auth } from '@/auth';
import { authentifierTicketRequest, validerV1Request, validerV2Request, approuverTicketRequest, rejeterFraudeRequest } from '@/features/tickets/request/tickets.request';
// Configuration
const BASE_URL = '/api/erp/bon-livraison';
const BASE_URL_2 = '/api/export/reporting';

const bonLivraisonEndpoints = {
  getBonLivraisonAll: {
    endpoint: `${BASE_URL}/tous`,
    method: 'GET',
  },
  bonLivraisonTerminers: { endpoint: `${BASE_URL}/tous-termines`, method: 'GET' },
  bonLivraisonTerminees: { endpoint: `${BASE_URL}/tous/termines`, method: 'GET' },
  bonLivraisonEnAttentes: { endpoint: `${BASE_URL}/tous-attentes`, method: 'GET' },
  reportingBonLivraison: { endpoint: `${BASE_URL_2}/facture-bon-livraison`, method: 'POST' },
  create: { endpoint: `${BASE_URL}/create`, method: 'POST' },
  update: { endpoint: `${BASE_URL}/update`, method: 'PUT' },
  delete: {
    endpoint: (id: string) => `${BASE_URL}/${id}`,
    method: 'DELETE',
  },
};

export async function getBonLivraisonAll(page: number, size: number, { dates: { start, end } }: { dates: RangeValue<string | null> }): Promise<PaginatedResponse<BonLivraison> | null> {
  try {
    return await apiClientHttp.request({
      endpoint: bonLivraisonEndpoints.getBonLivraisonAll.endpoint,
      method: bonLivraisonEndpoints.getBonLivraisonAll.method,
      params: {
        page: String(page),
        size: String(size),
        debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
        fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
      },
      service: 'backend',
    });
  } catch (error: any) {
    return null;
  }
}

export async function getAllBonLivraisonTerminers(page: number, size: number, { dates: { start, end } }: { dates: RangeValue<string | null> }, typeCommsion: string): Promise<BonLivraison[]> {
  try {
    return await apiClientHttp.request<BonLivraison[]>({
      endpoint: bonLivraisonEndpoints.bonLivraisonTerminers.endpoint,
      method: bonLivraisonEndpoints.bonLivraisonTerminers.method,
      params: {
        page: page.toString(),
        size: size.toString(),
        debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
        fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
        type: typeCommsion,
      },
    });
  } catch (error) {
    return [] as any;
  }
}

export async function getBonLivraisonTerminees({ dates: { start, end } }: { dates: RangeValue<string | null> }): Promise<BonLivraisonTerminee[]> {
  try {
    return await apiClientHttp.request<BonLivraisonTerminee[]>({
      endpoint: bonLivraisonEndpoints.bonLivraisonTerminees.endpoint,
      method: bonLivraisonEndpoints.bonLivraisonTerminees.method,
      params: { debut: start ? formatDate(start, 'YYYY-MM-DD') : '', fin: end ? formatDate(end, 'YYYY-MM-DD') : '' },
    });
  } catch (error) {
    return [] as any;
  }
}

export async function getAllBonLivraisonEnAttentes(
  page: number = 0,
  size: number = 10,
  { dates: { start, end } }: { dates: RangeValue<string | null> },
  typeCommsion: string,
): Promise<BonLivraison[]> {
  try {
    return await apiClientHttp.request<BonLivraison[]>({
      endpoint: bonLivraisonEndpoints.bonLivraisonEnAttentes.endpoint,
      method: bonLivraisonEndpoints.bonLivraisonEnAttentes.method,
      params: {
        page: page.toString(),
        size: size.toString(),
        debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
        fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
        type: typeCommsion,
      },
    });
  } catch (error) {
    return [] as any;
  }
}

export async function reportingBonLivraisonTerminers(parametre: ParametreBonLivraisonFacture): Promise<any | null> {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BACKEND_URL}${bonLivraisonEndpoints.reportingBonLivraison.endpoint}`, parametre, {
      responseType: 'arraybuffer',
    });
    return response.data;
  } catch (error: any) {
    if (error?.response?.data && error.response?.data?.message) {
      return {
        status: 'error',
        message: error?.response?.data?.message ?? 'Erreur lors du traitement',
      };
    } else if (error?.response?.data?.message) {
      return {
        status: 'error',
        message: error?.response?.data?.message ?? 'Erreur lors du traitement',
      };
    } else {
      return {
        status: 'error',
        message: 'Erreur lors du traitement',
      };
    }
  }
}

/**
 * Calculer la commission correctement avant l'envoi
 */
function calculateFinalCommission(ticket: Ticket, restaurant?: { typeCommission: string; commission: number }): number {
  const montantCommande = Number(ticket.montantCommande || 0);

  if (!restaurant || !montantCommande) {
    return 0;
  }

  const commission = Number(restaurant.commission ?? 0);

  if (restaurant.typeCommission === 'POURCENTAGE') {
    const calculatedCommission = montantCommande * (commission / 100);
    return Number(calculatedCommission.toFixed(2));
  }

  // Si c'est un montant fixe
  return commission;
}

/**
 * Créer un nouveau bon de livraison
 */
export async function createBonLivraison(ticket: Ticket, restaurant?: { typeCommission: string; commission: number }): Promise<ApiResult<BonLivraisonTerminee>> {
  try {
    const { id, code, ...rest } = ticket;

    // ✅ Calcul correct de la commission au moment de l'envoi
    const finalCommission = calculateFinalCommission(ticket, restaurant);

    const payload = {
      ...rest,
      reference: code,
      commission: finalCommission,
      coutLivraison: finalCommission,
    };

    const resp = await apiClientHttp.request<BonLivraisonTerminee>({
      endpoint: bonLivraisonEndpoints.create.endpoint,
      method: bonLivraisonEndpoints.create.method,
      service: 'backend',
      data: payload,
    });
    return {
      success: true,
      data: resp,
      message: 'Ticket créé avec succès',
    };
  } catch (error) {
    console.log(error);
    return handleApiError(error, 'Erreur lors de la création du bon de livraison');
  }
}

/**
 * Mettre à jour un bon de livraison existant
 */
export async function updateBonLivraison(ticketId: string, ticket: Ticket, restaurant?: { typeCommission: string; commission: number }): Promise<ApiResult<BonLivraisonTerminee>> {
  try {
    const { id, code, ...rest } = ticket;

    // ✅ Calcul correct de la commission au moment de l'envoi
    const finalCommission = calculateFinalCommission(ticket, restaurant);

    const payload = {
      ...rest,
      reference: code,
      commission: finalCommission,
      coutLivraison: finalCommission,
    };

    const resp = await apiClientHttp.request<BonLivraisonTerminee>({
      endpoint: bonLivraisonEndpoints.update.endpoint,
      method: bonLivraisonEndpoints.update.method,
      service: 'backend',
      data: { id: ticketId, ...payload },
    });
    return {
      success: true,
      data: resp,
      message: 'Ticket mis à jour avec succès',
    };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la mise à jour du bon de livraison');
  }
}

/**
 * Valider V1 un ticket (DGA — B08b, AUTHENTIFIE → V1_VALIDE)
 */
export async function validerV1Ticket(ticketId: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await validerV1Request(ticketId, userId);
    return { success: true, message: 'Ticket validé V1 avec succès' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la validation V1 du ticket');
  }
}

/**
 * Valider V2 un ticket (Responsable V&A — verrouillage irréversible)
 */
export async function validerV2Ticket(ticketId: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await validerV2Request(ticketId, userId);
    return { success: true, message: 'Ticket validé V2 avec succès' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la validation V2 du ticket');
  }
}

/**
 * Authentifier un ticket (Kader — B08)
 */
export async function authentifierTicket(ticketId: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    
    await authentifierTicketRequest(ticketId, userId);
    return { success: true, message: 'Ticket authentifié avec succès' };
  } catch (error) {
    return handleApiError(error, "Erreur lors de l'authentification du ticket");
  }
}

export async function approuverTicket(ticketId: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await approuverTicketRequest(ticketId, userId);
    return { success: true, message: 'Ticket approuvé avec succès' };
  } catch (error) {
    return handleApiError(error, "Erreur lors de l'approbation du ticket");
  }
}

export async function rejeterTicketPourFraude(ticketId: string, motif: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await rejeterFraudeRequest(ticketId, userId, motif);
    return { success: true, message: 'Ticket rejeté pour fraude' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors du rejet pour fraude');
  }
}

/**
 * Supprimer un bon de livraison
 */
export async function deleteBonLivraison(ticketId: string): Promise<boolean> {
  try {
    await apiClientHttp.request({
      endpoint: bonLivraisonEndpoints.delete.endpoint(ticketId),
      method: bonLivraisonEndpoints.delete.method,
      service: 'backend',
    });

    // ✅ Si on arrive ici sans exception, la suppression a réussi
    return true;
  } catch (error) {
    console.error('Erreur suppression:', error);
    return false;
  }
}
