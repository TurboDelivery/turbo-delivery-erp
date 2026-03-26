import { useQuery } from '@tanstack/react-query';
import { congeAPI } from '../apis/conge.api';
import React from 'react';

export const useEligibleEmployeesQuery = () => {
  const query = useQuery({
    queryKey: ['eligible-employees'],
    queryFn: async () => {
      return await congeAPI.obtenirEmployesEligiblesConge();
    },
    staleTime: 30 * 1000, //30 secondes
    refetchOnMount: true, //Refetch lors du mount
    retry: 2, // Limiter les tentatives de retry
    retryDelay: 1000, // 1 seconde entre les tentatives
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      console.error("Erreur lors de la récupération des employés éligibles:", query.error);
      // TODO: Ajouter notification toast quand disponible
    }
  }, [query.isError, query.error]);

  return query;
};
