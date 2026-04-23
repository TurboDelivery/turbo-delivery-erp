import { turboyAPI } from '@/features/turboys/apis/turboy.api';
import { ITurboyParams, ITurboy, IUpdateTurboyTypePayload, TurboyListResponse } from '@/features/turboys/types/turboys.types';
import { ActionResponse } from '@/types';
import { handleServerActionError } from '@/utils/handleServerActionError';
import { UpdateTurboyTypeDTO } from '@/features/turboys/schemas/turboy.schema';

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

