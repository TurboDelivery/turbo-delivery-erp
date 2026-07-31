'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { personnelHistorisationAPI, TypeLivreurBascule } from '../apis/personnel-historisation.api';

/**
 * Hooks du volet « historisation du personnel ». TanStack Query v4 : `keepPreviousData`,
 * `cacheTime`, `mutation.isLoading`.
 */

export const personnelHistorisationKeys = {
  all: ['personnel-historisation'] as const,
  effectif: () => [...personnelHistorisationKeys.all, 'effectif'] as const,
  moisMasse: () => [...personnelHistorisationKeys.all, 'masse-mois'] as const,
  masse: (mois: string) => [...personnelHistorisationKeys.all, 'masse', mois] as const,
  comparaison: (mois: string) => [...personnelHistorisationKeys.all, 'comparaison', mois] as const,
  anomalies: (type: string | null) => [...personnelHistorisationKeys.all, 'anomalies', type ?? 'TOUS'] as const,
  contratsEcheance: (jours: number) => [...personnelHistorisationKeys.all, 'contrats-echeance', jours] as const,
  dossier: (id: string) => [...personnelHistorisationKeys.all, 'dossier', id] as const,
  remunerations: (id: string) => [...personnelHistorisationKeys.all, 'remunerations', id] as const,
  auditFiche: (id: string) => [...personnelHistorisationKeys.all, 'audit-fiche', id] as const,
};

/**
 * Effectif enrichi. `retry: 1` volontairement : la composition agrège plusieurs appels, on
 * ne veut pas multiplier les rafales si le backend du module n'est pas encore déployé — le
 * bandeau de KPI se contente alors de disparaître, la page existante reste intacte.
 */
export const useEffectifQuery = () =>
  useQuery({
    queryKey: personnelHistorisationKeys.effectif(),
    queryFn: () => personnelHistorisationAPI.obtenirEffectif(),
    retry: 1,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useMoisMasseSalarialeQuery = () =>
  useQuery({
    queryKey: personnelHistorisationKeys.moisMasse(),
    queryFn: () => personnelHistorisationAPI.listerMoisMasseSalariale(24),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useMasseSalarialeQuery = (mois: string | null) =>
  useQuery({
    queryKey: personnelHistorisationKeys.masse(mois ?? ''),
    queryFn: () => personnelHistorisationAPI.obtenirMasseSalariale(mois as string),
    enabled: !!mois,
    keepPreviousData: true,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useComparaisonMasseSalarialeQuery = (mois: string | null) =>
  useQuery({
    queryKey: personnelHistorisationKeys.comparaison(mois ?? ''),
    queryFn: () => personnelHistorisationAPI.obtenirComparaisonMasseSalariale(mois as string),
    enabled: !!mois,
    keepPreviousData: true,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useAnomaliesQuery = (type: string | null) =>
  useQuery({
    queryKey: personnelHistorisationKeys.anomalies(type),
    queryFn: () => personnelHistorisationAPI.obtenirAnomalies(type),
    keepPreviousData: true,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

/** Horizon large : on veut TOUS les CDD actifs datés, pas seulement ceux qui alertent. */
export const useContratsEcheanceQuery = (jours = 3650) =>
  useQuery({
    queryKey: personnelHistorisationKeys.contratsEcheance(jours),
    queryFn: () => personnelHistorisationAPI.listerContratsEcheance(jours),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useDossierAgentQuery = (employeId: string | null) =>
  useQuery({
    queryKey: personnelHistorisationKeys.dossier(employeId ?? ''),
    queryFn: () => personnelHistorisationAPI.obtenirDossierAgent(employeId as string),
    enabled: !!employeId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

export const useRemunerationHistoriqueQuery = (employeId: string | null) =>
  useQuery({
    queryKey: personnelHistorisationKeys.remunerations(employeId ?? ''),
    queryFn: () => personnelHistorisationAPI.obtenirHistoriqueRemuneration(employeId as string),
    enabled: !!employeId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

/**
 * Historique d'audit de la fiche. L'endpoint est gardé (Direction / Admin / Ops Manager) :
 * on ne réessaie pas, un 403 est une réponse, pas une panne.
 */
export const useHistoriqueFicheQuery = (employeId: string | null, lecteurId: string | null) =>
  useQuery({
    queryKey: personnelHistorisationKeys.auditFiche(employeId ?? ''),
    queryFn: () => personnelHistorisationAPI.obtenirHistoriqueFiche(employeId as string, lecteurId as string),
    enabled: !!employeId && !!lecteurId,
    retry: false,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

export const useCloturerMasseSalarialeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mois, userId }: { mois: string; userId: string }) =>
      personnelHistorisationAPI.cloturerMasseSalariale(mois, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: personnelHistorisationKeys.moisMasse() });
      queryClient.invalidateQueries({ queryKey: personnelHistorisationKeys.masse(variables.mois) });
      queryClient.invalidateQueries({ queryKey: personnelHistorisationKeys.comparaison(variables.mois) });
      queryClient.invalidateQueries({ queryKey: personnelHistorisationKeys.effectif() });
    },
  });
};

/**
 * Bascule journalier ⇄ indépendant. Un clic, un appel : l'événement de parcours est écrit
 * par le serveur, l'écran se contente de rafraîchir le dossier.
 */
export const useBasculerTypeLivreurMutation = (employeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      livreurId,
      typeLivreur,
      userId,
    }: {
      livreurId: string;
      typeLivreur: TypeLivreurBascule;
      userId?: string | null;
    }) => personnelHistorisationAPI.basculerTypeLivreur(livreurId, typeLivreur, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personnelHistorisationKeys.dossier(employeId) });
      queryClient.invalidateQueries({ queryKey: personnelHistorisationKeys.auditFiche(employeId) });
      queryClient.invalidateQueries({ queryKey: personnelHistorisationKeys.effectif() });
    },
  });
};
