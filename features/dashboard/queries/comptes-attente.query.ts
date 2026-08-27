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

      // L'action relance desormais en cas de panne : le repli a zero ne couvre plus
      // un echec de lecture, seulement une reponse sans corps, qu'on signale au lieu
      // d'annoncer "0 compte en attente" sur la carte du dashboard.
      if (!page) throw new Error('Comptes en attente : reponse vide du service livreur');

      return page.totalElements;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
