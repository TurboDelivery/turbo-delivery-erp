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

// ─── Liste paginée + stats ─────────────────────────────────────────────────────

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

export const useInvalidateFacturesRFQuery = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: responsableFinancierKeys.lists() });
};
