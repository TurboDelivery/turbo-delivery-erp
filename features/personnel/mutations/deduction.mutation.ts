// 'use client';

// import { useMutation } from '@tanstack/react-query';
// import { ajouterDeductionAction, modifierDeductionAction, supprimerDeductionAction } from '../actions/deduction.action';
// import { useInvalidateDeductionQuery } from './index.query';
// import { toast } from 'sonner';
// import { processAndValidateFormData } from 'ak-zod-form-kit';
// import { DeductionCreateDTO, DeductionCreateSchema, DeductionUpdateDTO, DeductionUpdateSchema } from '@/features/personnel/schemas/deduction.schema';

// export const useAjouterDeductionMutation = () => {
//   const invalidateDeductionQuery = useInvalidateDeductionQuery();

//   return useMutation({
//     mutationFn: async (data: DeductionCreateDTO) => {
//       console.log('🔍 Mutation - Données reçues:', data);
      
//       // Validation des données

//       const validation = processAndValidateFormData(DeductionCreateSchema, data, {
//         outputFormat: 'object',
//       });

//       console.log('✅ Validation - Résultat:', validation);

//       if (!validation.success) {
//         console.error('❌ Validation - Erreurs:', validation.errorsInString);
//         throw new Error(validation.errorsInString || 'Une erreur est survenue lors de la validation des données.');
//       }

//       console.log('📤 Appel API - Données validées:', validation.data);

//       // Appel de l'API avec l'action
//       const result = await ajouterDeductionAction(validation.data as DeductionCreateDTO);

//       console.log('📥 Réponse API brute:', result);
//       console.log('📊 Données de retour:', result.data);

//       if (!result.success) {
//         console.error('❌ Erreur API:', result.error);
//         throw new Error(result.error || "Erreur lors de l'ajout de la déduction");
//       }

//       console.log('✅ Succès - Données finales:', result.data);
//       return result.data!;
//     },
//     onSuccess: async () => {
//       await invalidateDeductionQuery();
//       toast.success('Déduction ajoutée avec succès');
//     },

//     onError: async (error) => {
//       toast.error("Erreur lors de l'ajout de la déduction:", {
//         description: error instanceof Error ? error.message : 'Erreur inconnue',
//       });
//     },
//   });
// };

// export const useModifierDeductionMutation = () => {
//   const invalidateDeductionQuery = useInvalidateDeductionQuery();
//   return useMutation({
//     mutationFn: async ({ id, data }: { id: string; data: DeductionUpdateDTO }) => {
//       // Validation des données
//       const validation = processAndValidateFormData(DeductionUpdateSchema, data, {
//         outputFormat: 'object',
//       });
//       if (!validation.success) {
//         throw new Error(validation.errorsInString || 'Une erreur est survenue lors de la validation des données.');
//       }

//       const result = await modifierDeductionAction(id, validation.data as DeductionUpdateDTO);
//       if (!result.success) {
//         throw new Error(result.error || 'Erreur lors de la modification de la déduction');
//       }
//       return result.data!;
//     },
//     onSuccess: async () => {
//       await invalidateDeductionQuery();
//       toast.success('Déduction modifiée avec succès');
//     },
//     onError: async (error) => {
//       toast.error('Erreur modification déduction:', {
//         description: error instanceof Error ? error.message : 'Erreur inconnue',
//       });
//     },
//   });
// };

// export const useSupprimerDeductionMutation = () => {
//   const invalidateDeductionQuery = useInvalidateDeductionQuery();
//   return useMutation({
//     mutationFn: async (id: string) => {
//       if (!id) {
//         throw new Error("L'identifiant de la déduction est requis.");
//       }
//       const result = await supprimerDeductionAction(id);
//       if (!result.success) {
//         throw new Error(result.error || 'Erreur lors de la suppression de la déduction');
//       }
//       return result.data!;
//     },
//     onSuccess: async () => {
//       await invalidateDeductionQuery();
//       toast.success('Déduction supprimée avec succès');
//     },
//     onError: async (error) => {
//       toast.error('Erreur suppression déduction:', {
//         description: error instanceof Error ? error.message : 'Erreur inconnue',
//       });
//     },
//   });
// };
