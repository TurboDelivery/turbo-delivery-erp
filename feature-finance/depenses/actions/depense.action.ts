'use server';

import { ActionResponse, PaginatedResponse } from '@/types';
import { depenseAPI } from '@/features/depenses/apis/depense.api';
import { IDepense, IDepensesParams, IDepenseStats, IDepenseStatsParams, IDepenseSummary, IDepenseSummaryParams } from '@/features/depenses/types/depense.type';
import { handleServerActionError } from '@/utils/handleServerActionError';
import { DepenseCreateDTO, DepenseUpdateDTO } from '@/features/depenses/schemas/depense.schema';

export const obtenirTousDepensesAction = async (params: IDepensesParams): Promise<ActionResponse<PaginatedResponse<IDepense>>> => {
  try {
    const data = await depenseAPI.obtenirTousDepenses(params);
    return {
      success: true,
      data: data,
      message: 'Depenses obtenues avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération des dépenses');
  }
};


export const obtenirUneDepenseAction = async (id: string): Promise<ActionResponse<IDepense>> => {
  try {
    const data = await depenseAPI.obtenirDepense(id);
    return {
      success: true,
      data: data,
      message: 'Depense obtenue avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la récupération de la dépense');
  }
};

export const ajouterDepenseAction = async (data: DepenseCreateDTO): Promise<ActionResponse<IDepense>> => {
  try {
    console.log('🚀 Action Serveur - Données reçues:', data);
    console.log('📋 Détail complet:', {
      description: data.description,
      montant: data.montant,
      dateDepense: data.dateDepense,
      typeDepense: data.typeDepense,
      categorieDepense: data.categorieDepense,
      sourcePaiement: data.sourcePaiement,
      investissementId: data.investissementId
    });
    
    const response = await depenseAPI.ajouterDepense(data);
    
    console.log('📥 Réponse API (ajouterDepense):', response);
    console.log('🔍 Type de réponse:', typeof response);
    console.log('📊 Champs de la réponse:', Object.keys(response));
    console.log('💰 Montant:', response.montant);
    console.log('📝 TypeDepense:', response.typeDepense);
    console.log('📅 DateDepense:', response.dateDepense);
    
    return {
      success: true,
      data: response,
      message: 'Depense ajoutée avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur Action Serveur:', error);
    return handleServerActionError(error, "Erreur lors de l'ajout de la dépense");
  }
};

export const modifierDepenseAction = async (id: string, data: DepenseUpdateDTO): Promise<ActionResponse<IDepense>> => {
  try {
    const response = await depenseAPI.modifierDepense(id, data);
    return {
      success: true,
      data: response,
      message: 'Depense modifiée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la modification de la dépense');
  }
};

export const supprimerDepenseAction = async (id: string): Promise<ActionResponse<IDepense>> => {
  try {
    const data = await depenseAPI.supprimerDepense(id);
    return {
      success: true,
      data: data,
      message: 'Depense supprimée avec succès',
    };
  } catch (error) {
    return handleServerActionError(error, 'Erreur lors de la suppression de la dépense');
  }
};

export const obtenirStatsDepensesAction = async (params: IDepenseStatsParams): Promise<ActionResponse<IDepenseStats>> => {
  try {
    
    const response = await depenseAPI.obtenirStatsDepenses(params);
    return {
      success: true,
      data: response,
      message: 'Stats dépenses obtenues avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur Stats Action:', error);
    return handleServerActionError(error, 'Erreur lors de la récupération des stats dépenses');
  }
};

export const obtenirDepensesSummaryAction = async (params: IDepenseSummaryParams): Promise<ActionResponse<IDepenseSummary>> => {
  try {
    const response = await depenseAPI.obtenirDepensesSummary(params);
    return {
      success: true,
      data: response,
      message: 'Summary dépenses obtenu avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur Summary Action:', error);
    return handleServerActionError(error, 'Erreur lors de la récupération du summary dépenses');
  }
};

export const modifierStatutDepenseAction = async (id: string, statut: string): Promise<ActionResponse<IDepense>> => {
  try {
    console.log('🚀 Action Serveur - Modification statut dépense:', { id, statut });
    
    const response = await depenseAPI.modifierStatutDepense(id, statut);
    
    console.log('📥 Réponse API (modifierStatutDepense):', response);
    console.log('📊 Statut mis à jour:', response.statut);
    
    return {
      success: true,
      data: response,
      message: 'Statut de la dépense modifié avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur Action Serveur (modifierStatutDepense):', error);
    return handleServerActionError(error, 'Erreur lors de la modification du statut de la dépense');
  }
};

export const obtenirDepensesFixesAction = async (params?: IDepensesParams): Promise<ActionResponse<{ depensesFixes: IDepense[], totalFixes: number, totalVariables: number }>> => {
  try {
    console.log('🚀 Action Serveur - Obtention dépenses fixes:', params);
    
    const response = await depenseAPI.obtenirDepensesFixes(params);
    
    console.log('📥 Réponse API (obtenirDepensesFixes):', response);
    console.log('📊 Nombre de dépenses fixes:', response.depensesFixes.length);
    console.log('💰 Total fixes:', response.totalFixes);
    console.log('💰 Total variables:', response.totalVariables);
    
    return {
      success: true,
      data: response,
      message: 'Dépenses fixes obtenues avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur Action Serveur (obtenirDepensesFixes):', error);
    return handleServerActionError(error, 'Erreur lors de la récupération des dépenses fixes');
  }
};