'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  creerAccesPartenaire,
  listerAccesPartenaire,
  type ICreerAccesPayload,
} from '../actions/acces-partenaire.action';

const accesPartenaireKey = (restaurantId?: string) =>
  ['acces-partenaire', restaurantId ?? ''] as const;

/** Comptes d'accès Espace partenaire d'un restaurant. */
export const useAccesPartenaireQuery = (restaurantId?: string) =>
  useQuery({
    queryKey: accesPartenaireKey(restaurantId),
    queryFn: async () => {
      const result = await listerAccesPartenaire(restaurantId as string);
      if (result.status === 'error') throw new Error(result.message);
      return result.data;
    },
    enabled: !!restaurantId,
    staleTime: 30 * 1000,
  });

/** Création / réinitialisation d'un accès (upsert par email). */
export const useCreerAccesPartenaireMutation = (restaurantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ICreerAccesPayload) => {
      const result = await creerAccesPartenaire(restaurantId, payload);
      if (result.status === 'error') throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Accès créé — communiquez les identifiants au partenaire');
      queryClient.invalidateQueries({ queryKey: accesPartenaireKey(restaurantId) });
    },
    onError: (error: any) =>
      toast.error('Création impossible', {
        description: String(error?.message ?? 'Erreur inconnue'),
      }),
  });
};
