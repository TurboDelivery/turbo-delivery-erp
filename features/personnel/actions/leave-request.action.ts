// 'use server';

// import { leaveRequestAPI } from './apis/leave-request.api';
// import { LeaveRequestCreateDTO, LeaveRequestUpdateDTO } from '../schemas/leave-request.schema';

// export const ajouterLeaveRequestAction = async (data: LeaveRequestCreateDTO) => {
//   try {
//     const result = await leaveRequestAPI.ajouterDemande(data);
//     return {
//       success: true,
//       data: result,
//       error: null
//     };
//   } catch (error) {
//     console.error('Erreur ajouterLeaveRequestAction:', error);
//     return {
//       success: false,
//       data: null,
//       error: error instanceof Error ? error.message : 'Erreur inconnue'
//     };
//   }
// };

// export const modifierLeaveRequestAction = async (id: string, data: LeaveRequestUpdateDTO) => {
//   try {
//     const result = await leaveRequestAPI.modifierDemande(id, data);
//     return {
//       success: true,
//       data: result,
//       error: null
//     };
//   } catch (error) {
//     console.error('Erreur modifierLeaveRequestAction:', error);
//     return {
//       success: false,
//       data: null,
//       error: error instanceof Error ? error.message : 'Erreur inconnue'
//     };
//   }
// };

// export const supprimerLeaveRequestAction = async (id: string) => {
//   try {
//     const result = await leaveRequestAPI.supprimerDemande(id);
//     return {
//       success: true,
//       data: result,
//       error: null
//     };
//   } catch (error) {
//     console.error('Erreur supprimerLeaveRequestAction:', error);
//     return {
//       success: false,
//       data: null,
//       error: error instanceof Error ? error.message : 'Erreur inconnue'
//     };
//   }
// };
