import { useQueryClient } from '@tanstack/react-query';

export const chargeFixeKeyQuery = (...params: any[]) => {
  if (params.length === 0) return ['charge-fixe'];
  return ['charge-fixe', ...params];
};

export const useInvalidateChargeFixeQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: chargeFixeKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: chargeFixeKeyQuery(),
      type: 'active',
    });
  };
};
