import { useQueryClient } from '@tanstack/react-query';

export const depensesVariablesKeyQuery = (...params: any[]) => {
  if (params.length === 0) {
    return ['depenses-variables'];
  }
  return ['depenses-variables', ...params];
};

export const useInvalidateDepensesVariablesQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: depensesVariablesKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: depensesVariablesKeyQuery(),
      type: 'active',
    });
  };
};
