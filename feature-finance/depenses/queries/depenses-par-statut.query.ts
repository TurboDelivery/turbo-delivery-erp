import { useQuery } from '@tanstack/react-query';
import { depenseAPI } from '@/features/depenses/apis/depense.api';
import { IDepensesParams, IDepense } from '@/features/depenses/types/depense.type';

interface DepensesParStatutResponse {
  pending: IDepense[];
  paid: IDepense[];
  totalPending: number;
  totalPaid: number;
  total: number;
}

interface DepensesParStatutParams {
  debut?: Date;
  fin?: Date;
}

export const useDepensesParStatutQuery = (params?: DepensesParStatutParams) => {
  return useQuery({
    queryKey: ['depensesParStatut', params],
    queryFn: () => depenseAPI.obtenirDepensesParStatut(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
