'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { factureAPI } from '../apis/facture.api';
import { useInvalidateFacturesQuery } from './facture.query';
import { useInvalidateRecouvrementQuery } from './index.query';

export const useValiderFactureMutation = () => {
  const invalidateFacturesQuery = useInvalidateFacturesQuery();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error("L'identifiant de la facture est requis.");
      }
      return await factureAPI.validerFacture(id);
    },
    onSuccess: async () => {
      await invalidateFacturesQuery();
      toast.success('Facture validée avec succès');
    },
    onError: async (error) => {
      toast.error('Erreur lors de la validation de la facture', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useRecalculerFactureMutation = () => {
  const invalidateFacturesQuery = useInvalidateFacturesQuery();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error("L'identifiant de la facture est requis.");
      }
      return await factureAPI.recalculerFacture(id);
    },
    onSuccess: async () => {
      await invalidateFacturesQuery();
      toast.success('Facture recalculée avec succès', {
        description: 'Le montant a été recalculé sur la même période.',
      });
    },
    onError: async (error) => {
      toast.error('Erreur lors du recalcul de la facture', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useReinitialiserFactureMutation = () => {
  const invalidateFacturesQuery = useInvalidateFacturesQuery();
  const invalidateRecouvrementQuery = useInvalidateRecouvrementQuery();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error("L'identifiant de la facture est requis.");
      }
      return await factureAPI.reinitialiserFacture(id);
    },
    onSuccess: async () => {
      // Réinitialiser une facture supprime ses recouvrements → invalider les deux caches.
      await Promise.all([invalidateFacturesQuery(), invalidateRecouvrementQuery()]);
      toast.success('Facture réinitialisée avec succès', {
        description: "Tous les recouvrements ont été supprimés ; la facture revient à l'étape « validée, non payée ».",
      });
    },
    onError: async (error) => {
      toast.error('Erreur lors de la réinitialisation de la facture', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useSupprimerFactureMutation = () => {
  const invalidateFacturesQuery = useInvalidateFacturesQuery();
  const invalidateRecouvrementQuery = useInvalidateRecouvrementQuery();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      variables: string | { id: string; motif?: string; supprimerLiee?: boolean },
    ) => {
      const { id, ...options } =
        typeof variables === 'string' ? { id: variables } : variables;
      if (!id) {
        throw new Error("L'identifiant de la facture est requis.");
      }
      return await factureAPI.supprimerFacture(id, options);
    },
    onSuccess: async () => {
      // La suppression retire aussi les recouvrements orphelins → invalider les deux caches.
      await Promise.all([invalidateFacturesQuery(), invalidateRecouvrementQuery()]);
      // RG-09 : la suppression libère des jours et change les encours. Sans cette
      // invalidation, le relevé continuait d'afficher la facture supprimée.
      queryClient.invalidateQueries({ queryKey: ['encours'] });
      toast.success('Facture supprimée définitivement');
    },
    onError: async (error) => {
      toast.error('Erreur lors de la suppression de la facture', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

