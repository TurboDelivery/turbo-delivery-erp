'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { responsableFinancierAPI } from '@/features/responsable-financier';
import { IFactureRFParams } from '@/features/responsable-financier';

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

export const useFacturesRFQuery = (params?: IFactureRFParams) => {
  return useQuery({
    queryKey: responsableFinancierKeys.list(params),
    queryFn: () => responsableFinancierAPI.obtenirFactures(params),
    staleTime: 5 * 60 * 1000,
  });
};

// ─── Détail d'une facture ──────────────────────────────────────────────────────

export const useFactureRFQuery = (id: string) => {
  return useQuery({
    queryKey: responsableFinancierKeys.detail(id),
    queryFn: () => responsableFinancierAPI.obtenirFacture(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
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

// Invalide list + detail + agents : indispensable car les mutations (lancer
// recouvrement, valider, dépôt…) modifient aussi la facture vue en détail.
// Avant : seul lists() était invalidé → la page /[id] gardait du cache stale
// (ancien agent, historique non mis à jour) après une mutation.
export const useInvalidateFacturesRFQuery = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: responsableFinancierKeys.all });
};
