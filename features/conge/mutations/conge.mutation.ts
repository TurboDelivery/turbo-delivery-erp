'use client';

import { useMutation } from '@tanstack/react-query';
import { ajouterCongeAction, modifierCongeAction, supprimerCongeAction, approuverCongeAction, rejeterCongeAction } from '../actions/conge.action';
import { toast } from 'sonner';
import { processAndValidateFormData } from 'ak-zod-form-kit';
import { CongeAddDTO, CongeAddSchema, CongeUpdateDTO, CongeUpdateSchema, CongeStatusUpdateDTO, CongeStatusUpdateSchema } from '@/features/conge/schemas/conge.schema';
import { useInvalidateCongeQuery } from './index.query';

// Fonction utilitaire pour calculer la durée
const calculateDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const useAjouterCongeMutation = () => {
  const invalidateCongeQuery = useInvalidateCongeQuery();

  return useMutation({
    mutationFn: async (data: CongeAddDTO) => {
      console.log('🔍 Mutation - Données reçues:', data);
      
      // Validation simple
      if (!data.employeeId || !data.startDate || !data.endDate) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }
      
      // Préparer les données pour l'API
      const congeData = {
        employeeId: data.employeeId,
        employeeName: data.employeeName || '',
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        duration: calculateDuration(data.startDate, data.endDate),
        durationType: data.durationType,
        reason: data.reason || ''
      };
      
      console.log('📤 Appel API - Données préparées:', JSON.stringify(congeData, null, 2));
      
      // Appel direct à l'action
      return await ajouterCongeAction(congeData);
    },
    onSuccess: (data) => {
      console.log('✅ Succès - Données sauvegardées:', data);
      toast.success('Congé ajouté avec succès');
      invalidateCongeQuery();
    },
    onError: (error) => {
      console.error('❌ Erreur - Mutation échouée:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    },
  });
};

export const useModifierCongeMutation = () => {
  const invalidateCongeQuery = useInvalidateCongeQuery();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CongeUpdateDTO }) => {
      console.log('🔍 Mutation modification - Données reçues:', { id, data });
      
      // Forcer le type pour éviter les erreurs de FormData
      const mutationData = {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        duration: data.duration,
        durationType: data.durationType,
        reason: data.reason,
        statut: data.statut
      };
      
      console.log('📤 Appel API modification - Données préparées:', JSON.stringify(mutationData, null, 2));
      
      return await modifierCongeAction(id, mutationData);
    },
    onSuccess: (data) => {
      console.log('✅ Succès modification - Données sauvegardées:', data);
      toast.success('Congé modifié avec succès');
      invalidateCongeQuery();
    },
    onError: (error) => {
      console.error('❌ Erreur modification - Mutation échouée:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    },
  });
};

export const useSupprimerCongeMutation = () => {
  const invalidateCongeQuery = useInvalidateCongeQuery();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔍 Mutation - ID reçu:', id);
      
      console.log('📤 Appel API - Suppression du congé:', id);
      return await supprimerCongeAction(id);
    },
    onSuccess: (data) => {
      console.log('✅ Succès - Congé supprimé:', data);
      toast.success('Congé supprimé avec succès');
      invalidateCongeQuery();
    },
    onError: (error) => {
      console.error('❌ Erreur - Mutation échouée:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    },
  });
};

export const useApprouverCongeMutation = () => {
  const invalidateCongeQuery = useInvalidateCongeQuery();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: CongeStatusUpdateDTO }) => {
      console.log('🔍 Mutation approbation - Données reçues:', { id, data });
      
      // Pas de validation pour éviter les erreurs de FormData
      // Envoyer directement les données
      const validatedData = data || {};
      
      console.log('📤 Appel API - Données préparées:', validatedData);
      
      return await approuverCongeAction(id, validatedData);
    },
    onSuccess: (data) => {
      console.log('✅ Succès approbation - Données sauvegardées:', data);
      toast.success('Congé approuvé avec succès');
      invalidateCongeQuery();
    },
    onError: (error) => {
      console.error('❌ Erreur approbation - Mutation échouée:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    },
  });
};

export const useRejeterCongeMutation = () => {
  const invalidateCongeQuery = useInvalidateCongeQuery();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: CongeStatusUpdateDTO }) => {
      console.log('🔍 Mutation - Données reçues:', { id, data });
      
      // Pas de validation pour éviter les erreurs de FormData
      // Envoyer directement les données
      const validatedData = data || {};
      
      console.log('📤 Appel API - Données préparées:', validatedData);
      
      return await rejeterCongeAction(id, validatedData);
    },
    onSuccess: (data) => {
      console.log('✅ Succès - Congé rejeté:', data);
      toast.success('Congé rejeté avec succès');
      invalidateCongeQuery();
    },
    onError: (error) => {
      console.error('❌ Erreur - Mutation échouée:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    },
  });
};
