'use client';

import { useQuery } from '@tanstack/react-query';
import { entreeCaisseAPI } from '../apis/entree-caisse.api';
import { IEntreeCaisseParams } from '../types/entree-caisse.types';
import { entreeCaisseKeys } from './index.query';

export const useEntreeCaisseListQuery = (params?: IEntreeCaisseParams) => {
  return useQuery({
    queryKey: entreeCaisseKeys.list(params),
    queryFn: () => entreeCaisseAPI.lister(params),
    staleTime: 5 * 60 * 1000,
  });
};
