'use server';

import { turboyAPI } from '@/features/turboys/apis/turboy.api';
import { ITurboyParams, ITurboy, IUpdateTurboyTypePayload, TurboyListResponse } from '@/features/turboys/types/turboys.types';
import { ActionResponse } from '@/types';
import { handleServerActionError } from '@/utils/handleServerActionError';
import { UpdateTurboyTypeDTO } from '@/features/turboys/schemas/turboy.schema';
import { AxiosError } from 'axios';

export async function getTurboysByType(params: ITurboyParams): Promise<TurboyListResponse> {
  return turboyAPI.obtenirTurboyParType(params);
}

export async function getTurboyById(id: string): Promise<ITurboy> {
  return turboyAPI.obtenirTurboy(id);
}

export async function rejectTurboyAction(userId: string): Promise<ActionResponse<void>> {
  try {
    await turboyAPI.rejectTurboy(userId);
    return {
      success: true,
      message: 'Le livreur a été rejeté avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur Action Serveur:', error);
    return handleServerActionError(error, 'Erreur lors du rejet du livreur');
  }
}

export async function passerEnBirdAction(livreurId: string): Promise<ActionResponse<void>> {
  try {
    await turboyAPI.passerEnBird(livreurId);
    return {
      success: true,
      message: 'Le livreur a été passé en Bird avec succès',
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      const serverMsg = error.response?.data?.message || error.response?.data || error.message;
      console.error('❌ Erreur passage en Bird:', error.response?.status, serverMsg);
      return { success: false, error: typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg) };
    }
    console.error('❌ Erreur Action Serveur:', error);
    return handleServerActionError(error, 'Erreur lors du passage en Bird');
  }
}

export async function deleteTurboyAction(id: string): Promise<ActionResponse<void>> {
  try {
    await turboyAPI.deleteTurboy(id);
    return {
      success: true,
      message: 'Le livreur a été supprimé avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur Action Serveur:', error);
    return handleServerActionError(error, 'Erreur lors de la suppression du livreur');
  }
}

export async function updateTurboyTypeAction(data: UpdateTurboyTypeDTO): Promise<ActionResponse<ITurboy>> {
  try {

    const payload: IUpdateTurboyTypePayload = {
      id: data.id,
      typeLivreur: data.typeLivreur,
      salaire: data.typeLivreur === 'JOURNALIER' ? data.salaire : undefined,
    };

    const response = await turboyAPI.updateTurboyType(payload);
    return {
      success: true,
      data: response,
      message: 'Le type de livreur a été modifié avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur Action Serveur:', error);
    return handleServerActionError(error, 'Erreur lors de la modification du type de livreur');
  }
}

export async function bulkDesactiverLivreursAction(ids: string[]): Promise<ActionResponse<void>> {
  try {
    await turboyAPI.bulkDesactiverLivreurs(ids);
    return { success: true, message: 'Les livreurs ont été désactivés avec succès' };
  } catch (error) {
    console.error('❌ Erreur bulk désactivation:', error);
    return handleServerActionError(error, 'Erreur lors de la désactivation des livreurs');
  }
}

export async function bulkActiverLivreursAction(ids: string[]): Promise<ActionResponse<void>> {
  try {
    await turboyAPI.bulkActiverLivreurs(ids);
    return { success: true, message: 'Les livreurs ont été activés avec succès' };
  } catch (error) {
    console.error('❌ Erreur bulk activation:', error);
    return handleServerActionError(error, 'Erreur lors de l\'activation des livreurs');
  }
}

