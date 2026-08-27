'use client';

import { useQuery , keepPreviousData} from '@tanstack/react-query';

import { reportingAPI } from '../apis/reporting.api';
import { IJournalFiltre } from '../types/reporting.types';

export const reportingKeys = {
  all: ['reporting'] as const,
  journal: (f: IJournalFiltre) => [...reportingKeys.all, 'journal', f] as const,
  modules: () => [...reportingKeys.all, 'modules'] as const,
  rapport: (livreurId: string, debut?: string, fin?: string) =>
    [...reportingKeys.all, 'rapport', livreurId, debut ?? '', fin ?? ''] as const,
};

export const useJournalQuery = (filtre: IJournalFiltre) =>
  useQuery({
    queryKey: reportingKeys.journal(filtre),
    queryFn: () => reportingAPI.rechercherJournal(filtre),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

export const useModulesQuery = () =>
  useQuery({
    queryKey: reportingKeys.modules(),
    queryFn: () => reportingAPI.compterModules(),
    staleTime: 60 * 1000,
  });

export const useRapportPresenceQuery = (livreurId: string | null, debut?: string, fin?: string) =>
  useQuery({
    queryKey: reportingKeys.rapport(livreurId ?? '', debut, fin),
    queryFn: () => reportingAPI.rapportPresence(livreurId as string, debut, fin),
    enabled: !!livreurId,
    staleTime: 30 * 1000,
  });
