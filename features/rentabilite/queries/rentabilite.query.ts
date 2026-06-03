'use client';

import { useQuery } from '@tanstack/react-query';
import { rentabiliteAPI } from '../apis/rentabilite.api';

export const rentabiliteKeys = {
  all: ['rentabilite'] as const,
  byDate: (dateArret: string) => [...rentabiliteKeys.all, dateArret] as const,
};

/** Rentabilité temps réel à une date d'arrêté (défaut = aujourd'hui côté backend). */
export const useRentabiliteQuery = (dateArret: string) =>
  useQuery({
    queryKey: rentabiliteKeys.byDate(dateArret),
    queryFn: () => rentabiliteAPI.getRentabilite(dateArret),
    staleTime: 60 * 1000,
  });
