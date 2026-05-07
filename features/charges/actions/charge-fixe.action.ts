'use server';

import { ActionResponse, PaginatedResponse } from '@/types';
import { chargeFixeAPI } from '../apis/charge-fixe.api';
import { IChargeFixe, IChargeFixeParams, IWorkflowDecisionDtoFixe } from '../types/charge-fixe.type';
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

export const supprimerDepenseDuMoisAction = async (
  id: string,
  mois: string,
): Promise<ActionResponse<void>> => {
  try {
    await chargeFixeAPI.supprimerDepenseDuMois(id, mois);
    return { success: true, message: 'Dépense du mois supprimée avec succès' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la suppression de la dépense du mois');
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

export const validerDGAChargeFixeAction = async (
  id: string,
  dto: IWorkflowDecisionDtoFixe,
): Promise<ActionResponse<IChargeFixe>> => {
  try {
    const response = await chargeFixeAPI.validerDGAChargeFixe(id, dto);
    return { success: true, data: response, message: 'Charge fixe validée par DGA' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la validation DGA');
  }
};

export const approuverDGChargeFixeAction = async (
  id: string,
  dto: IWorkflowDecisionDtoFixe,
): Promise<ActionResponse<IChargeFixe>> => {
  try {
    const response = await chargeFixeAPI.approuverDGChargeFixe(id, dto);
    return { success: true, data: response, message: 'Charge fixe approuvée par DG' };
  } catch (error) {
    return handleServerActionError(error, "Erreur lors de l'approbation DG");
  }
};

export const rejeterDGAChargeFixeAction = async (
  id: string,
  dto: IWorkflowDecisionDtoFixe,
): Promise<ActionResponse<IChargeFixe>> => {
  try {
    const response = await chargeFixeAPI.rejeterDGAChargeFixe(id, dto);
    return { success: true, data: response, message: 'Charge fixe rejetée par DGA' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors du rejet DGA');
  }
};

export const rejeterDGChargeFixeAction = async (
  id: string,
  dto: IWorkflowDecisionDtoFixe,
): Promise<ActionResponse<IChargeFixe>> => {
  try {
    const response = await chargeFixeAPI.rejeterDGChargeFixe(id, dto);
    return { success: true, data: response, message: 'Charge fixe rejetée par DG' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors du rejet DG');
  }
};

export const decaisserChargeFixeAction = async (
  id: string,
  dto: IWorkflowDecisionDtoFixe,
): Promise<ActionResponse<IChargeFixe>> => {
  try {
    const response = await chargeFixeAPI.decaisserChargeFixe(id, dto);
    return { success: true, data: response, message: 'Charge fixe décaissée avec succès' };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors du décaissement');
  }
};
