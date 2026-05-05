import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const ticketsV2KeyQuery = (...params: any[]) => {
  if (params.length === 0) return ['tickets-v2'];
  return ['tickets-v2', ...params];
};

// 2- Hook d'invalidation
export const useInvalidateTicketsV2Query = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: ticketsV2KeyQuery(...params),
      exact: false,
    });
    await queryClient.refetchQueries({
      queryKey: ticketsV2KeyQuery(),
      type: 'active',
    });
  };
};
