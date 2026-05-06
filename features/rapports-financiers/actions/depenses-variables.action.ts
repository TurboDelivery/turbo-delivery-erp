'use server';

import { ActionResponse } from '@/types';
import {
  IDepenseVariableParams,
  IDepensesVariablesResponse,
} from '@/features/rapports-financiers/types/depenses-variables.type';
import { depensesVariablesAPI } from '@/features/rapports-financiers/apis/depenses-variables.api';
import { handleServerActionError } from '@/utils/handleServerActionError';

export const obtenirDepensesVariablesAction = async (
  params: IDepenseVariableParams,
): Promise<ActionResponse<IDepensesVariablesResponse>> => {
  try {
    const data = await depensesVariablesAPI.obtenirDepensesVariables(params);
    return {
      success: true,
      data,
      message: 'Dépenses variables obtenues avec succès',
    };
  } catch (error) {
    return handleServerActionError(
      error,
      'Erreur lors de la récupération des dépenses variables',
    );
  }
};
