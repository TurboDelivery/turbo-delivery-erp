'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { entreeCaisseAPI } from '../apis/entree-caisse.api';
import { useInvalidateEntreeCaisseQuery } from './index.query';
import {
  EntreeCaisseCreateDTO,
  EntreeCaisseUpdateDTO,
} from '../schemas/entree-caisse.schema';

export const useCreerEntreeCaisseMutation = () => {
  const invalidate = useInvalidateEntreeCaisseQuery();

  return useMutation({
    mutationFn: (data: EntreeCaisseCreateDTO) => entreeCaisseAPI.creer(data),
    onSuccess: async () => {
      await invalidate();
      toast.success('Entrée caisse créée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useModifierEntreeCaisseMutation = () => {
  const invalidate = useInvalidateEntreeCaisseQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntreeCaisseUpdateDTO }) =>
      entreeCaisseAPI.modifier(id, data),
    onSuccess: async () => {
      await invalidate();
      toast.success('Entrée caisse modifiée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useSupprimerEntreeCaisseMutation = () => {
  const invalidate = useInvalidateEntreeCaisseQuery();

  return useMutation({
    mutationFn: (id: string) => entreeCaisseAPI.supprimer(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Entrée caisse supprimée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
