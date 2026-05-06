import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const performanceKeyQuery = (...params: any[]) => {
  if (params.length === 0) {
    return ['performance'];
  }
  return ['performance', ...params];
};

// 2- Hook pour l'invalidation du cache
export const useInvalidatePerformanceQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: performanceKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: performanceKeyQuery(),
      type: 'active',
    });
  };
};
