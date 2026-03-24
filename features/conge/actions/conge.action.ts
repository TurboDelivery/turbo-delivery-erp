'use server';

import { congeAPI } from '../apis/conge.api';
import { CongeAddDTO, CongeUpdateDTO, CongeStatusUpdateDTO } from '../schemas/conge.schema';

export const ajouterCongeAction = async (data: CongeAddDTO) => {
  console.log('🔍 AjouterCongeAction - Données reçues:', JSON.stringify(data, null, 2));
  
  try {
    const result = await congeAPI.ajouterConge(data);
    console.log('✅ AjouterCongeAction - Résultat API:', JSON.stringify(result, null, 2));
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('❌ Erreur ajouterCongeAction:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

export const modifierCongeAction = async (id: string, data: CongeUpdateDTO) => {
  try {
    const result = await congeAPI.modifierConge(id, data);
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('Erreur modifierCongeAction:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

export const supprimerCongeAction = async (id: string) => {
  try {
    const result = await congeAPI.supprimerConge(id);
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('Erreur supprimerCongeAction:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

export const approuverCongeAction = async (id: string, data?: CongeStatusUpdateDTO) => {
  try {
    const result = await congeAPI.approuverConge(id, data);
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('Erreur approuverCongeAction:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

export const rejeterCongeAction = async (id: string, data?: CongeStatusUpdateDTO) => {
  try {
    const result = await congeAPI.rejeterConge(id, data);
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('Erreur rejeterCongeAction:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};
