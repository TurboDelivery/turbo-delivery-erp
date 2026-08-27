'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { creneauAPI, getCreneauActifApi, getCreneauxListApi, setCreneauActifApi } from '../apis/creneau.api';
import { ICreneauParams, ICreneauAnalyseComparaison, ICreneauDashboardParams, ICreneauActifVm } from '../types/creneau.types';

/**
 * 2026-05-29 — Helper centralisé pour signaler une erreur de chargement à
 * l'utilisateur ET au log dev. Avant : seul {@code console.error} était
 * appelé, ce qui rendait les pannes invisibles pour les utilisateurs
 * (écran vide ou stats à 0 sans explication). On affiche désormais un
 * toast non bloquant en plus du log.
 */
function signalerErreurChargement(contexte: string, error: unknown) {
  console.error(`Erreur lors de la récupération ${contexte}:`, error);
  const description = error instanceof Error ? error.message : 'Erreur inconnue';
  toast.error(`Erreur de chargement (${contexte})`, { description, duration: 5000 });
}

export const CRENEAU_ACTIF_KEY = ['creneau-actif'] as const;

export const useCreneauActifQuery = () =>
  useQuery<ICreneauActifVm | null>({
    queryKey: CRENEAU_ACTIF_KEY,
    queryFn: getCreneauActifApi,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

export const useCreneauxListQuery = (size = 50, includeInactifs = false) =>
  useQuery({
    // V58 (2026-05-29) — Clé inclut includeInactifs pour ne pas mélanger
    // le cache de la vue admin (tout) avec celui du picker (actifs seuls).
    queryKey: ['creneaux-list', size, includeInactifs ? 'all' : 'active'] as const,
    queryFn: () => getCreneauxListApi({ page: 0, size, includeInactifs }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

/**
 * V58 (2026-05-29) — Mutation admin : bascule le drapeau actif d'un créneau.
 * Invalide les deux caches (actifs seuls + tous) pour que le picker grille
 * de paiement reflète immédiatement le masquage.
 */
export const useSetCreneauActifMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ creneauId, actif, userId }: { creneauId: string; actif: boolean; userId: string }) =>
      setCreneauActifApi(creneauId, actif, userId),
    onSuccess: (_data, { actif }) => {
      queryClient.invalidateQueries({ queryKey: ['creneaux-list'] });
      // V59 (2026-05-29) — La gestion de visibilité vit désormais dans le
      // tableau "Historique des créneaux" ; on rafraîchit aussi ce cache et
      // celui du créneau actif (banner grille) après chaque bascule. Clé en
      // dur (= historiqueCreneauxKeys.all) pour éviter un import cross-feature.
      queryClient.invalidateQueries({ queryKey: ['historique-creneaux'] });
      queryClient.invalidateQueries({ queryKey: CRENEAU_ACTIF_KEY });
      toast.success(actif ? 'Créneau réactivé' : 'Créneau masqué', {
        description: actif
          ? 'Le créneau apparaît à nouveau dans les pickers.'
          : 'Le créneau est masqué des pickers. L\'historique reste intact.',
      });
    },
    onError: (error: unknown) => {
      const description = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Impossible de modifier le statut du créneau', { description });
    },
  });
};

export const creneauKeys = {
  all: ['creneaux'] as const,
  lists: () => [...creneauKeys.all, 'list'] as const,
  list: (params?: ICreneauParams) => [...creneauKeys.lists(), params] as const,
  stats: (semaine?: string) => [...creneauKeys.all, 'stats', semaine] as const,
  statsJour: (semaine?: string) => [...creneauKeys.all, 'stats-jour', semaine] as const,
  analyseComparaison: (mois?: string) => [...creneauKeys.all, 'analyse-comparaison', mois] as const,
  dashboard: (params?: ICreneauDashboardParams) => [...creneauKeys.all, 'dashboard', params] as const,
  dashboardRealite: (params?: ICreneauDashboardParams) => [...creneauKeys.all, 'dashboard-realite', params] as const,
  detailJour: (date: string) => [...creneauKeys.all, 'detail-jour', date] as const,
};

export const useCreneauxSemaineQuery = (params?: ICreneauParams) => {
  const query = useQuery({
    queryKey: creneauKeys.list(params),
    queryFn: () => creneauAPI.obtenirCreneauxSemaine(params),
    staleTime: 30_000,
    refetchOnMount: true,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      signalerErreurChargement('des créneaux', query.error);
    }
  }, [query.isError, query.error]);

  return query;
};

export const useCreneauStatsQuery = (semaine?: string) => {
  const query = useQuery({
    queryKey: creneauKeys.stats(semaine),
    queryFn: () => creneauAPI.obtenirStats(semaine ? { semaine } : undefined),
    staleTime: 60_000,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      signalerErreurChargement('des stats créneaux', query.error);
    }
  }, [query.isError, query.error]);

  return query;
};

export const useStatistiquesParJourQuery = (semaine?: string) => {
  const query = useQuery({
    queryKey: creneauKeys.statsJour(semaine),
    queryFn: () => creneauAPI.obtenirStatistiquesParJour(semaine ? { semaine } : undefined),
    staleTime: 60_000,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      signalerErreurChargement('des stats par jour', query.error);
    }
  }, [query.isError, query.error]);

  return query;
};

export const useCreneauAnalyseComparaisonQuery = (mois?: string) => {
  const query = useQuery<ICreneauAnalyseComparaison>({
    queryKey: creneauKeys.analyseComparaison(mois),
    queryFn: () => creneauAPI.obtenirStatAnalyseComparaison(mois ? { mois } : undefined),
    staleTime: 60_000,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      signalerErreurChargement('de l\'analyse comparaison', query.error);
    }
  }, [query.isError, query.error]);

  return query;
};

export const useCreneauDashboardQuery = (params?: ICreneauDashboardParams) => {
  const query = useQuery({
    queryKey: creneauKeys.dashboard(params),
    queryFn: () => creneauAPI.obtenirDashboard(params),
    staleTime: 30_000,
    refetchOnMount: true,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      signalerErreurChargement('du dashboard prévisionnel', query.error);
    }
  }, [query.isError, query.error]);

  return query;
};

export const useCreneauDashboardRealiteQuery = (params?: ICreneauDashboardParams) => {
  const query = useQuery({
    queryKey: creneauKeys.dashboardRealite(params),
    queryFn: () => creneauAPI.obtenirDashboardRealite(params),
    staleTime: 30_000,
    refetchOnMount: true,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      signalerErreurChargement('du dashboard réalité', query.error);
    }
  }, [query.isError, query.error]);

  return query;
};

export const useCreneauDetailJourQuery = (date: string) => {
  const query = useQuery({
    queryKey: creneauKeys.detailJour(date),
    queryFn: () => creneauAPI.obtenirDetailJour(date),
    staleTime: 60_000,
    refetchOnMount: true,
    enabled: !!date,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      signalerErreurChargement('du détail jour', query.error);
    }
  }, [query.isError, query.error]);

  return query;
};
