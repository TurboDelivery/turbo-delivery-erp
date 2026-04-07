import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { financeResumeAPI } from '../apis/finance-resume.api';
import { IFinanceResumeParams } from '../types/finance-resume.type';

export const useFinanceResumeQuery = (params: IFinanceResumeParams) => {
  const query = useQuery({
    queryKey: ['financeResume', params],
    queryFn: () => financeResumeAPI.obtenirResume(params),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération du résumé financier', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};
