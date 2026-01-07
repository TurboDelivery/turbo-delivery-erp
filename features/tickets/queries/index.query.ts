import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const ticketsKeyQuery = (...params: any[]) => {
  if (params.length === 0) {
    return ['tickets'];
  }
  return ['tickets', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateTicketsQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: ticketsKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: ticketsKeyQuery(),
      type: 'active',
    });
  };
};
