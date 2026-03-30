'use client';

import { useQuery } from '@tanstack/react-query';
import { obtenirDepensesFixesAction } from '../actions/depense.action';
import { IDepensesParams } from '@/features/depenses/types/depense.type';

interface DepensesFixesResponse {
  depensesFixes: any[];
  totalFixes: number;
  totalVariables: number;
}

export const useDepensesFixesQuery = (params?: IDepensesParams) => {
  return useQuery({
    queryKey: ['depensesFixes', params],
    queryFn: async () => {
      console.log('🔍 Query - Obtention dépenses fixes:', params);
      
      const result = await obtenirDepensesFixesAction(params);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des dépenses fixes');
      }
      return result.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
