import { useQueryClient } from '@tanstack/react-query';

export const traficKeyQuery = (...params: any[]) => {
  if (params.length === 0) {
    return ['trafic'];
  }
  return ['trafic', ...params];
};

export const useInvalidateTraficQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: traficKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: traficKeyQuery(),
      type: 'active',
    });
  };
};
