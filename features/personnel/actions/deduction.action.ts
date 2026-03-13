// 'use server';

// import { deductionAPI } from './apis/deduction.api';
// import { DeductionCreateDTO, DeductionUpdateDTO } from '../schemas/deduction.schema';

// export const ajouterDeductionAction = async (data: DeductionCreateDTO) => {
//   try {
//     const result = await deductionAPI.ajouterDeduction(data);
//     return {
//       success: true,
//       data: result,
//       error: null
//     };
//   } catch (error) {
//     console.error('Erreur ajouterDeductionAction:', error);
//     return {
//       success: false,
//       data: null,
//       error: error instanceof Error ? error.message : 'Erreur inconnue'
//     };
//   }
// };

// export const modifierDeductionAction = async (id: string, data: DeductionUpdateDTO) => {
//   try {
//     const result = await deductionAPI.modifierDeduction(id, data);
//     return {
//       success: true,
//       data: result,
//       error: null
//     };
//   } catch (error) {
//     console.error('Erreur modifierDeductionAction:', error);
//     return {
//       success: false,
//       data: null,
//       error: error instanceof Error ? error.message : 'Erreur inconnue'
//     };
//   }
// };

// export const supprimerDeductionAction = async (id: string) => {
//   try {
//     const result = await deductionAPI.supprimerDeduction(id);
//     return {
//       success: true,
//       data: result,
//       error: null
//     };
//   } catch (error) {
//     console.error('Erreur supprimerDeductionAction:', error);
//     return {
//       success: false,
//       data: null,
//       error: error instanceof Error ? error.message : 'Erreur inconnue'
//     };
//   }
// };
