'use client';

import { useQuery } from '@tanstack/react-query';

import { getDeliveryMenNoValidated } from '@/src/actions/delivery-men.actions';

/**
 * M1 (RG-07) — nombre de comptes livreur en attente de validation, pour le KPI
 * dashboard. Réutilise l'endpoint de liste (size=1) et lit `totalElements`.
 */
export const useComptesEnAttenteQuery = () =>
  useQuery({
    queryKey: ['comptes-en-attente'],
    queryFn: async () => {
      const page = await getDeliveryMenNoValidated(0, 1);
      return page?.totalElements ?? 0;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
