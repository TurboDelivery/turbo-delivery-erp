import { useQueryClient } from '@tanstack/react-query';

export const chargeVariableKeyQuery = (...params: any[]) => {
  if (params.length === 0) return ['charge-variable'];
  return ['charge-variable', ...params];
};

export const useInvalidateChargeVariableQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: chargeVariableKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: chargeVariableKeyQuery(),
      type: 'active',
    });
  };
};
