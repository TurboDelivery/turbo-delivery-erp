'use server';

import { ActionResponse, PaginatedResponse } from '@/types';
import { chargeFixeAPI } from '../apis/charge-fixe.api';
import { IChargeFixe, IChargeFixeParams } from '../types/charge-fixe.type';
import { handleServerActionError } from '@/utils/handleServerActionError';
import { ChargeFixeCreateDTO, ChargeFixeUpdateDTO } from '../schemas/charge-fixe.schema';

export const ajouterChargeFixeAction = async (
  data: ChargeFixeCreateDTO,
): Promise<ActionResponse<IChargeFixe>> => {
  try {
    const response = await chargeFixeAPI.ajouterChargeFixe(data);
    return {
      success: true,
      data: response,
      message: 'Charge fixe ajoutée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, "Erreur lors de l'ajout de la charge fixe");
  }
};

export const modifierChargeFixeAction = async (
  id: string,
  data: ChargeFixeUpdateDTO,
): Promise<ActionResponse<IChargeFixe>> => {
  try {
    const response = await chargeFixeAPI.modifierChargeFixe(id, data);
    return {
      success: true,
      data: response,
      message: 'Charge fixe modifiée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la modification de la charge fixe');
  }
};

export const supprimerChargeFixeAction = async (
  id: string,
): Promise<ActionResponse<void>> => {
  try {
    await chargeFixeAPI.supprimerChargeFixe(id);
    return {
      success: true,
      message: 'Charge fixe supprimée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la suppression de la charge fixe');
  }
};

export const obtenirChargesFixesAction = async (
  params: IChargeFixeParams,
): Promise<ActionResponse<PaginatedResponse<IChargeFixe>>> => {
  try {
    const response = await chargeFixeAPI.obtenirChargesFixes(params);
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération des charges fixes');
  }
};
