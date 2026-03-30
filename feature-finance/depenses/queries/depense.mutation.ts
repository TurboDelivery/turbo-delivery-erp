'use client';

import { useMutation } from '@tanstack/react-query';
import { ajouterDepenseAction, modifierDepenseAction, supprimerDepenseAction, modifierStatutDepenseAction, obtenirDepensesFixesAction } from '../actions/depense.action';
import { useInvalidateDepenseQuery } from './index.query';
import { toast } from 'sonner';
import { processAndValidateFormData } from 'ak-zod-form-kit';
import { DepenseCreateDTO, DepenseCreateSchema, DepenseUpdateDTO, DepenseUpdateSchema } from '@/features/depenses/schemas/depense.schema';

export const useAjouterDepenseMutation = () => {
  const invalidateDepenseQuery = useInvalidateDepenseQuery();

  return useMutation({
    mutationFn: async (data: DepenseCreateDTO) => {
      console.log('🔍 Mutation - Données reçues:', data);
      
      // Validation des données
      const validation = processAndValidateFormData(DepenseCreateSchema, data, {
        outputFormat: 'object',
      });

      console.log('✅ Validation - Résultat:', validation);

      if (!validation.success) {
        console.error('❌ Validation - Erreurs:', validation.errorsInString);
        throw new Error(validation.errorsInString || 'Une erreur est survenue lors de la validation des données.');
      }

      console.log('📤 Appel API - Données validées:', validation.data);

      // Appel de l'API avec l'action
      const result = await ajouterDepenseAction(validation.data as DepenseCreateDTO);

      console.log('📥 Réponse API brute:', result);
      console.log('📊 Données de retour:', result.data);

      if (!result.success) {
        console.error('❌ Erreur API:', result.error);
        throw new Error(result.error || "Erreur lors de l'ajout de la dépense");
      }

      console.log('✅ Succès - Données finales:', result.data);
      return result.data!;
    },
    onSuccess: async () => {
      await invalidateDepenseQuery();
      toast.success('Depense ajoutée avec succès');
    },

    onError: async (error) => {
      toast.error("Erreur lors de l'ajout de la dépense:", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useModifierDepenseMutation = () => {
  const invalidateDepenseQuery = useInvalidateDepenseQuery();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DepenseUpdateDTO }) => {
      // Validation des données
      const validation = processAndValidateFormData(DepenseUpdateSchema, data, {
        outputFormat: 'object',
      });
      if (!validation.success) {
        throw new Error(validation.errorsInString || 'Une erreur est survenue lors de la validation des données.');
      }

      const result = await modifierDepenseAction(id, validation.data as DepenseUpdateDTO);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification de la dépense');
      }
      return result.data!;
    },
    onSuccess: async () => {
      await invalidateDepenseQuery();
      toast.success('Depense modifiée avec succès');
    },
    onError: async (error) => {
      toast.error('Erreur modification depense:', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useSupprimerDepenseMutation = () => {
  const invalidateDepenseQuery = useInvalidateDepenseQuery();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error("L'identifiant de la dépense est requis.");
      }
      const result = await supprimerDepenseAction(id);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression de la dépense');
      }
      return result.data!;
    },
    onSuccess: async () => {
      await invalidateDepenseQuery();
      toast.success('Depense supprimée avec succès');
    },
    onError: async (error) => {
      toast.error('Erreur suppression depense:', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useModifierStatutDepenseMutation = () => {
  const invalidateDepenseQuery = useInvalidateDepenseQuery();
  
  return useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      if (!id) {
        throw new Error("L'identifiant de la dépense est requis.");
      }
      if (!statut) {
        throw new Error("Le statut est requis.");
      }
      
      console.log('🔍 Mutation - Modification statut:', { id, statut });
      
      const result = await modifierStatutDepenseAction(id, statut);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification du statut de la dépense');
      }
      return result.data!;
    },
    onSuccess: async () => {
      await invalidateDepenseQuery();
      toast.success('Statut de la dépense modifié avec succès');
    },
    onError: async (error) => {
      toast.error('Erreur modification statut:', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useObtenirDepensesFixesMutation = () => {
  const invalidateDepenseQuery = useInvalidateDepenseQuery();
  
  return useMutation({
    mutationFn: async (params?: { debut?: Date; fin?: Date }) => {
      console.log('🔍 Mutation - Obtention dépenses fixes:', params);
      
      const result = await obtenirDepensesFixesAction(params);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des dépenses fixes');
      }
      return result.data!;
    },
    onSuccess: async () => {
      await invalidateDepenseQuery();
      toast.success('Dépenses fixes récupérées avec succès');
    },
    onError: async (error) => {
      toast.error('Erreur récupération dépenses fixes:', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
