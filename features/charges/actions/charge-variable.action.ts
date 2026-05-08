'use server';

import { ActionResponse } from '@/types';
import { chargeVariableAPI } from '../apis/charge-variable.api';
import {
  IChargeVariable,
  IChargeVariableCreateDTO,
  IChargeVariableUpdateDTO,
  IChargeVariableParams,
  IWorkflowDecisionDto,
} from '../types/charge-variable.type';
import { PaginatedResponse } from '@/types/general';
import { handleApiError } from '@/utils/handle-api-error';

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
    return handleApiError(error, "Erreur lors de l'ajout de la charge variable");
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
    return handleApiError(error, "Erreur lors de l'ajout de la charge variable");
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
    return handleApiError(error, 'Erreur lors de la modification de la charge variable');
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
    return handleApiError(error, 'Erreur lors de la modification de la charge variable');
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
    return handleApiError(error, 'Erreur lors de la suppression de la charge variable');
  }
};

export const validerDGAChargeVariableAction = async (
  id: string,
  dto: IWorkflowDecisionDto,
): Promise<ActionResponse<IChargeVariable>> => {
  try {
    const response = await chargeVariableAPI.validerDGAChargeVariable(id, dto);
    return { success: true, data: response, message: 'Charge variable visée par le DGA' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la validation DGA');
  }
};

export const approuverDGChargeVariableAction = async (
  id: string,
  dto: IWorkflowDecisionDto,
): Promise<ActionResponse<IChargeVariable>> => {
  try {
    const response = await chargeVariableAPI.approuverDGChargeVariable(id, dto);
    return { success: true, data: response, message: 'Charge variable approuvée par le DG' };
  } catch (error) {
    return handleApiError(error, "Erreur lors de l'approbation DG");
  }
};

export const rejeterDGAChargeVariableAction = async (
  id: string,
  dto: IWorkflowDecisionDto,
): Promise<ActionResponse<IChargeVariable>> => {
  try {
    const response = await chargeVariableAPI.rejeterDGAChargeVariable(id, dto);
    return { success: true, data: response, message: 'Charge variable rejetée par le DGA' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors du rejet DGA');
  }
};

export const rejeterDGChargeVariableAction = async (
  id: string,
  dto: IWorkflowDecisionDto,
): Promise<ActionResponse<IChargeVariable>> => {
  try {
    const response = await chargeVariableAPI.rejeterDGChargeVariable(id, dto);
    return { success: true, data: response, message: 'Charge variable rejetée par le DG' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors du rejet DG');
  }
};

export const decaisserChargeVariableAction = async (
  id: string,
  dto: IWorkflowDecisionDto,
): Promise<ActionResponse<IChargeVariable>> => {
  try {
    const response = await chargeVariableAPI.decaisserChargeVariable(id, dto);
    return { success: true, data: response, message: 'Charge variable décaissée' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors du décaissement');
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
    return handleApiError(error, 'Erreur lors de la récupération des charges variables');
  }
};
