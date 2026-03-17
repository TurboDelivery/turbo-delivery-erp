import { useQueryClient } from '@tanstack/react-query';

export const dashboardKeyQuery = (...params: any[]) => {
  if (params.length === 0) {
    return ['dashboard'];
  }
  return ['dashboard', ...params];
};

export const useInvalidateDashboardQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: dashboardKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: dashboardKeyQuery(),
      type: 'active',
    });
  };
};
