import { turboyAPI } from '@/features/turboys/apis/turboy.api';
import { ITurboyParams, ITurboy, IUpdateTurboyTypePayload } from '@/features/turboys/types/turboys.types';
import { PaginatedResponse } from '@/types/general';
import { ActionResponse } from '@/types';
import { handleServerActionError } from '@/utils/handleServerActionError';
import { UpdateTurboyTypeDTO } from '@/features/turboys/schemas/turboy.schema';

export async function getTurboysByType(params: ITurboyParams): Promise<PaginatedResponse<ITurboy>> {
  const result = await turboyAPI.obtenirTurboyParType(params);
  console.log('📋 Liste livreurs:', result);
  return result;
}

export async function getTurboyById(id: string): Promise<ITurboy> {
  return turboyAPI.obtenirTurboy(id);
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

