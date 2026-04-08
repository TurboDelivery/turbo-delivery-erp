import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { validationStatsAPI } from '../apis/validation-stats.api';
import { IValidationStatsParams } from '../types/validation-stats.type';

const validationStatsKeyQuery = (params: IValidationStatsParams) => [
  'validation-stats',
  params.role,
  params.debut,
  params.fin,
];

export const useValidationStatsQuery = (params: IValidationStatsParams) => {
  const query = useQuery({
    queryKey: validationStatsKeyQuery(params),
    queryFn: () => validationStatsAPI.obtenirStats(params),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des statistiques de validation', {
        description: query.error instanceof Error ? query.error.message : 'Erreur inconnue',
      });
    }
  }, [query.isError, query.error]);

  return query;
};
