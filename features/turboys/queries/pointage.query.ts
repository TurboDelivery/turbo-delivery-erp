'use client';

import { useQuery } from '@tanstack/react-query';
import { listerPointagesLivreurAction } from '@/features/turboys/actions/pointage.actions';

export const pointageKeys = {
  all: ['pointage'] as const,
  parLivreur: (id: string) => [...pointageKeys.all, 'livreur', id] as const,
};

export const usePointagesLivreurQuery = (id: string) =>
  useQuery({
    queryKey: pointageKeys.parLivreur(id),
    queryFn: () => listerPointagesLivreurAction(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
