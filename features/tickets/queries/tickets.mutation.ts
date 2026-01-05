import { useMutation } from '@tanstack/react-query';
import { useInvalidateTicketsQuery } from './index.query';
import { createBonLivraison, deleteBonLivraison } from '@/src/actions/bon-commande.action';


export const useCreateBonLivraison = () => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: createBonLivraison,
    onSuccess: async () => {
      await invalidateTicketsQuery();
    },
  });
};

export const useDeleteBonLivraison = () => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: deleteBonLivraison,
    onSuccess: async () => {
      await invalidateTicketsQuery();
    },
  });
};
