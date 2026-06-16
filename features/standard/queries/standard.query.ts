'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { standardAPI } from '../apis/standard.api';
import { IChangerStatutIncident, ICreerMotifIncident, IModifierMotifIncident, StatutIncident } from '../types/standard.types';

export const standardKeys = {
  all: ['standard'] as const,
  incidents: (statut?: StatutIncident, page?: number) => [...standardKeys.all, 'incidents', statut ?? 'TOUS', page ?? 0] as const,
  incident: (id: string) => [...standardKeys.all, 'incident', id] as const,
  ouverts: () => [...standardKeys.all, 'ouverts'] as const,
  motifs: () => [...standardKeys.all, 'motifs'] as const,
  appels: (page?: number) => [...standardKeys.all, 'appels', page ?? 0] as const,
};

export const useIncidentsQuery = (statut: StatutIncident | undefined, page: number, size = 20) =>
  useQuery({
    queryKey: standardKeys.incidents(statut, page),
    queryFn: () => standardAPI.listerIncidents({ statut, page, size }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

export const useIncidentsOuvertsQuery = () =>
  useQuery({
    queryKey: standardKeys.ouverts(),
    queryFn: () => standardAPI.compterOuverts(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // rafraîchit le badge périodiquement
    refetchOnWindowFocus: true,
  });

export const useChangerStatutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto, userId }: { id: string; dto: IChangerStatutIncident; userId: string }) =>
      standardAPI.changerStatut(id, dto, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(standardKeys.incident(data.id), data);
      queryClient.invalidateQueries({ queryKey: [...standardKeys.all, 'incidents'] });
      queryClient.invalidateQueries({ queryKey: standardKeys.ouverts() });
      toast.success('Statut de l\'incident mis à jour');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Impossible de modifier le statut', { description });
    },
  });
};

// ─── Administration des motifs ────────────────────────────────────────────────

export const useMotifsQuery = () =>
  useQuery({
    queryKey: standardKeys.motifs(),
    queryFn: () => standardAPI.listerMotifs(),
    staleTime: 5 * 60 * 1000,
  });

export const useCreerMotifMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ICreerMotifIncident) => standardAPI.creerMotif(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standardKeys.motifs() });
      toast.success('Motif créé');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Impossible de créer le motif', { description });
    },
  });
};

export const useModifierMotifMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, dto }: { code: string; dto: IModifierMotifIncident }) => standardAPI.modifierMotif(code, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standardKeys.motifs() });
      toast.success('Motif mis à jour');
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Impossible de modifier le motif', { description });
    },
  });
};
