'use server';

import { employeeAPI } from '../apis/employee.api';
import { EmployeeCreateDTO, EmployeeUpdateDTO } from '../schemas/employee.schema';

export const ajouterEmployeAction = async (data: EmployeeCreateDTO) => {
  try {
    const result = await employeeAPI.ajouterEmploye(data);
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('Erreur ajouterEmployeAction:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

export const modifierEmployeAction = async (id: string, data: EmployeeUpdateDTO) => {
  try {
    const result = await employeeAPI.modifierEmploye(id, data);
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('Erreur modifierEmployeAction:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

export const supprimerEmployeAction = async (id: string) => {
  try {
    const result = await employeeAPI.supprimerEmploye(id);
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('Erreur supprimerEmployeAction:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};
