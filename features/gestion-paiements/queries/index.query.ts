import { useQueryClient } from '@tanstack/react-query';

export const paiementKeyQuery = (...params: any[]) => {
  if (params.length === 0) return ['paiement'];
  return ['paiement', ...params];
};

export const useInvalidatePaiementQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: paiementKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: paiementKeyQuery(),
      type: 'active',
    });
  };
};
