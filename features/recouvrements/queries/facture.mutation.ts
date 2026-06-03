'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { factureAPI } from '../apis/facture.api';
import { useInvalidateFacturesQuery } from './facture.query';

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

