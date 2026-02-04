'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { factureAPI } from '../apis/facture.api';
import { IFactureParams } from '../types/facture.types';
import { useMemo } from 'react';

// Clés de query
export const factureKeys = {
  all: ['factures'] as const,
  lists: () => [...factureKeys.all, 'list'] as const,
  list: (params?: IFactureParams) => [...factureKeys.lists(), params] as const,
  details: () => [...factureKeys.all, 'detail'] as const,
  detail: (id: string) => [...factureKeys.details(), id] as const,
  byRestaurant: (restaurantId: string, params?: IFactureParams) =>
    [...factureKeys.all, 'restaurant', restaurantId, params] as const,
};

// Hook pour récupérer la liste paginée des factures
export const useFacturesQuery = (params?: IFactureParams) => {
  return useQuery({
    queryKey: factureKeys.list(params),
    queryFn: () => factureAPI.obtenirFactures(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer une facture par ID
export const useFactureQuery = (id: string) => {
  return useQuery({
    queryKey: factureKeys.detail(id),
    queryFn: () => factureAPI.obtenirFacture(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour récupérer les factures d'un restaurant ou toutes les factures
export const useFacturesParRestaurantQuery = (restaurantId?: string, params?: IFactureParams) => {
  const searchParams = useMemo(() => {
    return {
      ...params,
      ...(restaurantId && { restaurantId }),
    };
  }, [restaurantId, params]);

  return useQuery({
    queryKey: restaurantId ? factureKeys.byRestaurant(restaurantId, params) : factureKeys.list(params),
    queryFn: () => restaurantId
      ? factureAPI.obtenirFacturesParRestaurant(restaurantId, searchParams)
      : factureAPI.obtenirFactures(searchParams),
    enabled: true, // Toujours enabled, même si restaurantId est vide
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour invalider le cache des factures
export const useInvalidateFacturesQuery = () => {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: factureKeys.all });
  };
};
