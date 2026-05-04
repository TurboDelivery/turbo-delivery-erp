'use client';

import { useQuery } from '@tanstack/react-query';
import { PaginatedResponse } from '@/types';
import { entreeCaisseAPI } from '../apis/entree-caisse.api';
import { IEntreeCaisse, IEntreeCaissePaginatedParams } from '../types/entree-caisse.types';
import { entreeCaisseKeys } from './index.query';

export const useEntreeCaissePaginatedQuery = (params?: IEntreeCaissePaginatedParams) => {
  return useQuery({
    queryKey: entreeCaisseKeys.paginated(params),
    queryFn: () => entreeCaisseAPI.listerPagine(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev: PaginatedResponse<IEntreeCaisse> | undefined) => prev,
  });
};
