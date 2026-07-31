'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { supervisionAPI } from '../apis/supervision.api';
import { IActionsFiltre, IConnexionsFiltre, ISessionsFiltre } from '../types';

/** Cadence de rafraîchissement des vues « temps réel » (spec : ≤ 30 s). */
export const INTERVALLE_TEMPS_REEL = 30 * 1000;

export const supervisionKeys = {
  all: ['supervision'] as const,
  stats: () => [...supervisionKeys.all, 'stats'] as const,
  enLigne: (filtre: ISessionsFiltre) =>
    [...supervisionKeys.all, 'en-ligne', filtre.agence, filtre.statut, filtre.recherche] as const,
  actions: (filtre: IActionsFiltre) =>
    [
      ...supervisionKeys.all,
      'actions',
      filtre.module,
      filtre.typeAction,
      filtre.recherche,
      filtre.depuis,
      filtre.jusqua,
      filtre.page,
    ] as const,
  connexions: (filtre: IConnexionsFiltre) =>
    [
      ...supervisionKeys.all,
      'connexions',
      filtre.typeEvenement,
      filtre.recherche,
      filtre.depuis,
      filtre.jusqua,
      filtre.page,
    ] as const,
  adoption: (jamaisConnectes: boolean) => [...supervisionKeys.all, 'adoption', jamaisConnectes] as const,
  modules: () => [...supervisionKeys.all, 'modules'] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Lectures
// ─────────────────────────────────────────────────────────────────────────────

/** KPI de tête d'écran. Rafraîchis à la même cadence que les présences. */
export const useSupervisionStatsQuery = (userId: string) =>
  useQuery({
    queryKey: supervisionKeys.stats(),
    queryFn: () => supervisionAPI.stats(userId),
    enabled: !!userId,
    refetchInterval: INTERVALLE_TEMPS_REEL,
    refetchOnWindowFocus: true,
  });

/**
 * Présences. Le rafraîchissement passe par `refetchInterval` et non par un
 * `setInterval` maison : React Query suspend le cycle quand l'onglet du
 * navigateur est en arrière-plan et le reprend au retour, sans fuite de timer.
 */
export const useSessionsEnLigneQuery = (userId: string, filtre: ISessionsFiltre) =>
  useQuery({
    queryKey: supervisionKeys.enLigne(filtre),
    queryFn: () => supervisionAPI.enLigne(userId, filtre),
    enabled: !!userId,
    refetchInterval: INTERVALLE_TEMPS_REEL,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

export const useAuditActionsQuery = (userId: string, filtre: IActionsFiltre, size = 25) =>
  useQuery({
    queryKey: supervisionKeys.actions(filtre),
    queryFn: () => supervisionAPI.actions(userId, filtre, size),
    enabled: !!userId,
    keepPreviousData: true,
    staleTime: 15 * 1000,
  });

export const useConnexionsQuery = (userId: string, filtre: IConnexionsFiltre, size = 25) =>
  useQuery({
    queryKey: supervisionKeys.connexions(filtre),
    queryFn: () => supervisionAPI.connexions(userId, filtre, size),
    enabled: !!userId,
    keepPreviousData: true,
    staleTime: 15 * 1000,
  });

export const useAdoptionQuery = (userId: string, jamaisConnectes: boolean) =>
  useQuery({
    queryKey: supervisionKeys.adoption(jamaisConnectes),
    queryFn: () => supervisionAPI.adoption(userId, jamaisConnectes),
    enabled: !!userId,
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });

/** Liste des modules du journal — change peu, mise en cache longue. */
export const useModulesAuditQuery = (userId: string) =>
  useQuery({
    queryKey: supervisionKeys.modules(),
    queryFn: () => supervisionAPI.modules(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

// ─────────────────────────────────────────────────────────────────────────────
// Écriture — l'UNIQUE mutation de l'écran (critère d'acceptation n°8 : l'audit
// est en lecture seule, la déconnexion forcée agit sur la session, pas sur le
// journal, et elle est elle-même tracée côté backend).
// ─────────────────────────────────────────────────────────────────────────────

export const useForcerDeconnexionMutation = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => supervisionAPI.forcerDeconnexion(sessionId, userId),
    onSuccess: (resultat) => {
      queryClient.invalidateQueries({ queryKey: [...supervisionKeys.all, 'en-ligne'] });
      queryClient.invalidateQueries({ queryKey: supervisionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: [...supervisionKeys.all, 'connexions'] });
      toast.success('Session fermée', {
        description:
          resultat?.message ??
          'La déconnexion prendra effet au prochain battement du poste concerné (30 s au plus).',
      });
    },
    onError: (erreur: unknown) => {
      const description = erreur instanceof Error ? erreur.message : 'Erreur inconnue';
      toast.error('Déconnexion forcée impossible', { description });
    },
  });
};
