'use server';
import { ActionResponse, PaginatedResponse } from '@/types';
import { handleServerActionError } from '@/utils/handleServerActionError';
import { IRecouvrement, IRecouvrementParams } from '../../types/recouvrement/recouvrement.types';
import { recouvrementAPI } from '@/features/recouvrements/apis/recouvrement.api';

export async function ajouterRecouvrementAction(formData: FormData): Promise<ActionResponse<IRecouvrement>> {
  try {
    const createdRecouvrement = await recouvrementAPI.ajouterRecouvrement(formData);

    return {
      success: true,
      data: createdRecouvrement,
      message: 'Recouvrement ajouté avec succès.',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la création du recouvrement.');
  }
}

export async function modifierRecouvrementAction(id: string, formData: FormData): Promise<ActionResponse<IRecouvrement>> {
  try {
    const updatedRecouvrement = await recouvrementAPI.modifierRecouvrement(id, formData);

    return {
      success: true,
      data: updatedRecouvrement,
      message: 'Recouvrement modifié avec succès.',
    };
  } catch (apiError: any) {
    return handleServerActionError(apiError, 'Erreur lors de la mise à jour du recouvrement.');
  }
}

export async function supprimerRecouvrementAction(id: string): Promise<ActionResponse<void>> {
  try {
    await recouvrementAPI.supprimerRecouvrement(id);
    return {
      success: true,
      message: 'Recouvrement supprimé avec succès.',
    };
  } catch (apiError: any) {
    return handleServerActionError(apiError, 'Erreur lors de la suppression du recouvrement.');
  }
}

export async function obtenirRecouvrementDetailAction(id: string): Promise<ActionResponse<IRecouvrement>> {
  try {
    const getRecouvrement = await recouvrementAPI.obtenirRecouvrement(id);
    return {
      success: true,
      data: getRecouvrement,
      message: 'Recouvrement récupéré avec succès.',
    };
  } catch (apiError: any) {
    return handleServerActionError(apiError, 'Erreur lors de la récupération du recouvrement.');
  }
}

export async function obtenirTousRecouvrementsAction(params: IRecouvrementParams): Promise<ActionResponse<PaginatedResponse<IRecouvrement>>> {
  try {
    const getAllRecouvrements = await recouvrementAPI.obtenirTousRecouvrements(params);
    return {
      success: true,
      data: getAllRecouvrements,
      message: 'Recouvrements récupérés avec succès.',
    };
  } catch (apiError: any) {
    return handleServerActionError(apiError, 'Erreur lors de la récupération des recouvrements.');
  }
}
