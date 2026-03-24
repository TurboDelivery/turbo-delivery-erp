import { useQueryClient } from '@tanstack/react-query';
import { congeQueryKeys } from '../queries/conge.query';

export const useInvalidateCongeQuery = () => {
  const queryClient = useQueryClient();
  
  return () => {
    // Invalider toutes les queries de congés
    queryClient.invalidateQueries({ queryKey: congeQueryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: congeQueryKeys.details() });
    queryClient.invalidateQueries({ queryKey: congeQueryKeys.employee('') });
  };
};
