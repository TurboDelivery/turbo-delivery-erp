import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const regularisationKeyQuery = (...params: any[]) => {
  if (params.length === 0) return ['regularisation'];
  return ['regularisation', ...params];
};

// 2- Hook d'invalidation
export const useInvalidateRegularisationQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: regularisationKeyQuery(...params),
      exact: false,
    });
    await queryClient.refetchQueries({
      queryKey: regularisationKeyQuery(),
      type: 'active',
    });
  };
};
