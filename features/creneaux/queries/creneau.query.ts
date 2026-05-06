'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { creneauAPI, getCreneauActifApi, getCreneauxListApi } from '../apis/creneau.api';
import { ICreneauParams, ICreneauAnalyseComparaison, ICreneauDashboardParams, ICreneauActifVm } from '../types/creneau.types';

export const CRENEAU_ACTIF_KEY = ['creneau-actif'] as const;

export const useCreneauActifQuery = () =>
  useQuery<ICreneauActifVm | null>({
    queryKey: CRENEAU_ACTIF_KEY,
    queryFn: getCreneauActifApi,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

export const useCreneauxListQuery = (size = 50) =>
  useQuery({
    queryKey: ['creneaux-list', size] as const,
    queryFn: () => getCreneauxListApi({ page: 0, size }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
      console.error('Erreur lors de la recuperation des creneaux:', query.error);
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
      console.error('Erreur lors de la recuperation des stats creneaux:', query.error);
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
      console.error('Erreur lors de la recuperation des stats par jour:', query.error);
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
      console.error('Erreur lors de la recuperation de l\'analyse comparaison:', query.error);
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
      console.error('Erreur lors de la recuperation du dashboard creneaux:', query.error);
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
      console.error('Erreur lors de la recuperation du dashboard réalité creneaux:', query.error);
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
      console.error('Erreur lors de la recuperation du detail jour:', query.error);
    }
  }, [query.isError, query.error]);

  return query;
};
