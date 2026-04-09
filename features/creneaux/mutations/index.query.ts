import { useQueryClient } from '@tanstack/react-query';

export const useInvalidateCreneauQuery = () => {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: ['creneaux'],
      exact: false,
    });
  };
};
