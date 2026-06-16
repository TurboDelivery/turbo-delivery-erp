import { useQuery } from '@tanstack/react-query';

import { getQuartiersRequest } from '@/features/trafic/request/quartier.request';

export const QUARTIERS_KEY = ['trafic', 'quartiers'] as const;

/** Quartiers (légende + cercles de la carte). Faible cardinalité → cache long. */
export const useQuartiersQuery = () =>
  useQuery({
    queryKey: QUARTIERS_KEY,
    queryFn: getQuartiersRequest,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
