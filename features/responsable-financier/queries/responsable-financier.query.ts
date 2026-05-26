'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { responsableFinancierAPI } from '../apis/responsable-financier.api';
import { IFactureRFParams } from '../types/responsable-financier.types';

// ─── Clés de query ─────────────────────────────────────────────────────────────

export const responsableFinancierKeys = {
  all: ['responsable-financier'] as const,
  lists: () => [...responsableFinancierKeys.all, 'list'] as const,
  list: (params?: IFactureRFParams) => [...responsableFinancierKeys.lists(), params] as const,
  details: () => [...responsableFinancierKeys.all, 'detail'] as const,
  detail: (id: string) => [...responsableFinancierKeys.details(), id] as const,
  agents: () => [...responsableFinancierKeys.all, 'agents'] as const,
};

// ─── Liste paginée ─────────────────────────────────────────────────────────────

// Fix B1 (2026-05) : staleTime ramené de 5min à 30s. Avant : un user qui
// assignait un recouvreur voyait la table refetcher correctement, mais s'il
// rouvrait la page dans les 5min, TanStack servait le cache stale (= agent
// précédent encore affiché, "Medard par défaut" perçu côté métier).
export const useFacturesRFQuery = (params?: IFactureRFParams) => {
  return useQuery({
    queryKey: responsableFinancierKeys.list(params),
    queryFn: () => responsableFinancierAPI.obtenirFactures(params),
    staleTime: 30 * 1000,
  });
};

// ─── Détail d'une facture ──────────────────────────────────────────────────────

// Fix B1 : staleTime court (10s) sur le détail — le drawer "lancer recouvrement"
// rouvre souvent la même facture juste après une mutation pour vérifier l'agent
// assigné. Avec 5min de stale on aurait servi l'ancien agent.
export const useFactureRFQuery = (id: string) => {
  return useQuery({
    queryKey: responsableFinancierKeys.detail(id),
    queryFn: () => responsableFinancierAPI.obtenirFacture(id),
    enabled: !!id,
    staleTime: 10 * 1000,
  });
};

// ─── Agents de recouvrement ────────────────────────────────────────────────────

export const useAgentsRecouvrementQuery = () => {
  return useQuery({
    queryKey: responsableFinancierKeys.agents(),
    queryFn: () => responsableFinancierAPI.obtenirAgents(),
    staleTime: 10 * 60 * 1000,
  });
};

// ─── Invalidation ─────────────────────────────────────────────────────────────

// Fix B1 : invalide à la fois listes ET détails, et force `refetchType: 'all'`
// (au lieu du défaut 'active') pour que même les queries inactives soient
// rechargées dès leur prochaine utilisation. Avant : seule la liste affichée
// était refetchée et le détail spécifique servait un cache stale.
export const useInvalidateFacturesRFQuery = () => {
  const queryClient = useQueryClient();
  return async (factureId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: responsableFinancierKeys.lists(),
        refetchType: 'all',
      }),
      queryClient.invalidateQueries({
        queryKey: factureId
          ? responsableFinancierKeys.detail(factureId)
          : responsableFinancierKeys.details(),
        refetchType: 'all',
      }),
    ]);
  };
};
