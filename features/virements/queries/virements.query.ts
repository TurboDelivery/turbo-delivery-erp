'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { virementsAPI } from '../apis/virements.api';

export const virementsKeys = {
  all: ['virements'] as const,
  payeurs: () => [...virementsKeys.all, 'payeurs'] as const,
  rattachements: (payeurId: string) => [...virementsKeys.all, 'rattachements', payeurId] as const,
  liste: (payeurIds: string[]) => [...virementsKeys.all, 'liste', [...payeurIds].sort()] as const,
  parametre: (groupeId?: string, restaurantId?: string) =>
    [...virementsKeys.all, 'parametre', groupeId ?? null, restaurantId ?? null] as const,
};

export const usePayeursQuery = () =>
  useQuery({
    queryKey: virementsKeys.payeurs(),
    queryFn: () => virementsAPI.listerPayeurs(),
    staleTime: 5 * 60 * 1000,
  });

export const useRattachementsQuery = (payeurId: string | null) =>
  useQuery({
    queryKey: virementsKeys.rattachements(payeurId ?? ''),
    queryFn: () => virementsAPI.rattachements(payeurId as string),
    enabled: !!payeurId,
  });

/**
 * ⚠ La clé trie les identifiants : sans ça, deux sélections identiques mais dans un
 * ordre différent produisent deux entrées de cache pour la même donnée, et l'écran
 * recharge sans raison.
 */
export const useVirementsQuery = (payeurIds: string[]) =>
  useQuery({
    queryKey: virementsKeys.liste(payeurIds),
    queryFn: () => virementsAPI.listerVirements(payeurIds),
    staleTime: 60 * 1000,
  });

export const useParametreQuery = (cible: { groupeId?: string; restaurantId?: string }) =>
  useQuery({
    queryKey: virementsKeys.parametre(cible.groupeId, cible.restaurantId),
    queryFn: () => virementsAPI.lireParametre(cible),
    enabled: !!(cible.groupeId || cible.restaurantId),
  });

export const useInvalidateVirements = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: virementsKeys.all });
};
