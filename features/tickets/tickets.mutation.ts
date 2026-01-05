import { useMutation } from '@tanstack/react-query';
import { useInvalidateTicketsQuery } from './queries/index.query';
import { createBonLivraisonRequest, deleteBonLivraisonRequest } from './request/tickets.request';


export const useCreateBonLivraison = () => {
  const invalidate = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: createBonLivraisonRequest,
    onSuccess: async () => {
      await invalidate('list');
    },
  });
};

export const useDeleteBonLivraison = () => {
  const invalidate = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: deleteBonLivraisonRequest,
    onSuccess: async () => {
      await invalidate('list');
    },
  });
};
