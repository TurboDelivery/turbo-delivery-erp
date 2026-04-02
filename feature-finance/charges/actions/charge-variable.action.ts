'use server';

import { ActionResponse } from '@/types';
import { chargeVariableAPI } from '../apis/charge-variable.api';
import {
  IChargeVariable,
  IChargeVariableCreateDTO,
  IChargeVariableUpdateDTO,
  IChargeVariableParams,
} from '../types/charge-variable.type';
import { PaginatedResponse } from '@/types/general';
import { handleServerActionError } from '@/utils/handleServerActionError';

export const ajouterChargeVariableAction = async (
  data: IChargeVariableCreateDTO,
): Promise<ActionResponse<IChargeVariable>> => {
  try {
    const response = await chargeVariableAPI.ajouterChargeVariable(data);
    return {
      success: true,
      data: response,
      message: 'Charge variable ajoutée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, "Erreur lors de l'ajout de la charge variable");
  }
};

export const ajouterChargeVariableFormDataAction = async (
  data: FormData,
): Promise<ActionResponse<IChargeVariable>> => {
  try {
    const response = await chargeVariableAPI.ajouterChargeVariableFormData(data);
    return {
      success: true,
      data: response,
      message: 'Charge variable ajoutée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, "Erreur lors de l'ajout de la charge variable");
  }
};

export const modifierChargeVariableAction = async (
  id: string,
  data: IChargeVariableUpdateDTO,
): Promise<ActionResponse<IChargeVariable>> => {
  try {
    const response = await chargeVariableAPI.modifierChargeVariable(id, data);
    return {
      success: true,
      data: response,
      message: 'Charge variable modifiée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la modification de la charge variable');
  }
};

export const modifierChargeVariableFormDataAction = async (
  id: string,
  data: FormData,
): Promise<ActionResponse<IChargeVariable>> => {
  try {
    const response = await chargeVariableAPI.modifierChargeVariableFormData(id, data);
    return {
      success: true,
      data: response,
      message: 'Charge variable modifiée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la modification de la charge variable');
  }
};

export const supprimerChargeVariableAction = async (
  id: string,
): Promise<ActionResponse<void>> => {
  try {
    await chargeVariableAPI.supprimerChargeVariable(id);
    return {
      success: true,
      message: 'Charge variable supprimée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la suppression de la charge variable');
  }
};

export const obtenirChargesVariablesAction = async (
  params: IChargeVariableParams,
): Promise<ActionResponse<PaginatedResponse<IChargeVariable>>> => {
  try {
    const response = await chargeVariableAPI.obtenirChargesVariablesPagination(params);
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération des charges variables');
  }
};
