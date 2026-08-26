'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createDeliveryFee, updatePriceList } from '@/src/price-list/price-list.action';
import { PriceListFormData } from '../schemas/price-list.schema';
import { useInvalidatePriceListQuery } from './price-list.query';

export const useCreateDeliveryFeeMutation = () => {
  const invalidate = useInvalidatePriceListQuery();

  return useMutation({
    mutationFn: async (data: PriceListFormData) => {
      const result = await createDeliveryFee(data);
      if (result.status === 'error') throw new Error(result.message);
      return result;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Frais de livraison créé avec succès');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    },
  });
};

export const useUpdatePriceListMutation = () => {
  const invalidate = useInvalidatePriceListQuery();

  return useMutation({
    mutationFn: async (data: PriceListFormData) => {
      const result = await (updatePriceList as (d: PriceListFormData) => ReturnType<typeof updatePriceList>)(data);
      if (result.status === 'error') throw new Error(result.message);
      return result;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Frais de livraison modifié avec succès');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    },
  });
};
