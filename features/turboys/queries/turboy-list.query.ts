'use client';

import { useQuery } from '@tanstack/react-query';
import { getTurboysByType, getTurboyById } from '@/features/turboys/actions/turboy.actions';
import { ITurboyParams } from '@/features/turboys/types/turboys.types';

export const turboyKeys = {
  all: ['turboys'] as const,
  lists: () => [...turboyKeys.all, 'list'] as const,
  list: (params: ITurboyParams) => [...turboyKeys.lists(), params] as const,
  details: () => [...turboyKeys.all, 'detail'] as const,
  detail: (id: string) => [...turboyKeys.details(), id] as const,
};

export const useTurboysByTypeQuery = (params: ITurboyParams) => {
  return useQuery({
    queryKey: turboyKeys.list(params),
    queryFn: () => getTurboysByType(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTurboyQuery = (id: string) => {
  return useQuery({
    queryKey: turboyKeys.detail(id),
    queryFn: () => getTurboyById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

