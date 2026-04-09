'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { creneauAPI } from '../apis/creneau.api';
import { ICreneauParams } from '../types/creneau.types';

export const creneauKeys = {
  all: ['creneaux'] as const,
  lists: () => [...creneauKeys.all, 'list'] as const,
  list: (params?: ICreneauParams) => [...creneauKeys.lists(), params] as const,
  stats: (semaine?: string) => [...creneauKeys.all, 'stats', semaine] as const,
  statsJour: (semaine?: string) => [...creneauKeys.all, 'stats-jour', semaine] as const,
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
