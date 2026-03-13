// 'use client';

// import { useMutation } from '@tanstack/react-query';
// import { ajouterLeaveRequestAction, modifierLeaveRequestAction, supprimerLeaveRequestAction } from '../actions/leave-request.action';
// import { useInvalidateLeaveRequestQuery } from './index.query';
// import { toast } from 'sonner';
// import { processAndValidateFormData } from 'ak-zod-form-kit';
// import { LeaveRequestCreateDTO, LeaveRequestCreateSchema, LeaveRequestUpdateDTO, LeaveRequestUpdateSchema } from '@/features/personnel/schemas/leave-request.schema';

// export const useAjouterLeaveRequestMutation = () => {
//   const invalidateLeaveRequestQuery = useInvalidateLeaveRequestQuery();

//   return useMutation({
//     mutationFn: async (data: LeaveRequestCreateDTO) => {
//       console.log('🔍 Mutation - Données reçues:', data);
      
//       // Validation des données
//       const validation = processAndValidateFormData(LeaveRequestCreateSchema, data, {
//         outputFormat: 'object',
//       });

//       console.log('✅ Validation - Résultat:', validation);

//       if (!validation.success) {
//         console.error('❌ Validation - Erreurs:', validation.errorsInString);
//         throw new Error(validation.errorsInString || 'Une erreur est survenue lors de la validation des données.');
//       }

//       console.log('📤 Appel API - Données validées:', validation.data);

//       // Appel de l'API avec l'action
//       const result = await ajouterLeaveRequestAction(validation.data as LeaveRequestCreateDTO);

//       console.log('📥 Réponse API brute:', result);
//       console.log('📊 Données de retour:', result.data);

//       if (!result.success) {
//         console.error('❌ Erreur API:', result.error);
//         throw new Error(result.error || "Erreur lors de l'ajout de la demande de congé");
//       }

//       console.log('✅ Succès - Données finales:', result.data);
//       return result.data!;
//     },
//     onSuccess: async () => {
//       await invalidateLeaveRequestQuery();
//       toast.success('Demande de congé ajoutée avec succès');
//     },

//     onError: async (error) => {
//       toast.error("Erreur lors de l'ajout de la demande de congé:", {
//         description: error instanceof Error ? error.message : 'Erreur inconnue',
//       });
//     },
//   });
// };

// export const useModifierLeaveRequestMutation = () => {
//   const invalidateLeaveRequestQuery = useInvalidateLeaveRequestQuery();
//   return useMutation({
//     mutationFn: async ({ id, data }: { id: string; data: LeaveRequestUpdateDTO }) => {
//       // Validation des données
//       const validation = processAndValidateFormData(LeaveRequestUpdateSchema, data, {
//         outputFormat: 'object',
//       });
//       if (!validation.success) {
//         throw new Error(validation.errorsInString || 'Une erreur est survenue lors de la validation des données.');
//       }

//       const result = await modifierLeaveRequestAction(id, validation.data as LeaveRequestUpdateDTO);
//       if (!result.success) {
//         throw new Error(result.error || 'Erreur lors de la modification de la demande de congé');
//       }
//       return result.data!;
//     },
//     onSuccess: async () => {
//       await invalidateLeaveRequestQuery();
//       toast.success('Demande de congé modifiée avec succès');
//     },
//     onError: async (error) => {
//       toast.error('Erreur modification demande de congé:', {
//         description: error instanceof Error ? error.message : 'Erreur inconnue',
//       });
//     },
//   });
// };

// export const useSupprimerLeaveRequestMutation = () => {
//   const invalidateLeaveRequestQuery = useInvalidateLeaveRequestQuery();
//   return useMutation({
//     mutationFn: async (id: string) => {
//       if (!id) {
//         throw new Error("L'identifiant de la demande de congé est requis.");
//       }
//       const result = await supprimerLeaveRequestAction(id);
//       if (!result.success) {
//         throw new Error(result.error || 'Erreur lors de la suppression de la demande de congé');
//       }
//       return result.data!;
//     },
//     onSuccess: async () => {
//       await invalidateLeaveRequestQuery();
//       toast.success('Demande de congé supprimée avec succès');
//     },
//     onError: async (error) => {
//       toast.error('Erreur suppression demande de congé:', {
//         description: error instanceof Error ? error.message : 'Erreur inconnue',
//       });
//     },
//   });
// };
