import React from 'react';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ticketsKeyQuery } from './index.query';
import getQueryClient from '@/lib/get-query-client';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { toast } from 'sonner';
import { getBonLivraisonRequest } from '@/features/tickets/request/tickets.request';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { PaginatedResponse } from '@/types';

const queryClient = getQueryClient();

//1- Option de requête optimisée
export const ticketsInfiniteQueryOption = (ticketsParamsDTO: ITicketParams) => {
  return {
    queryKey: ticketsKeyQuery('list', ticketsParamsDTO),
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      return await getBonLivraisonRequest({ ...ticketsParamsDTO, page: pageParam });
    },
    staleTime: 60 * 1000, //
    refetchOnMount: true,
  initialPageParam: 0,
    getNextPageParam: (lastPage: PaginatedResponse<BonLivraisonTerminee>) => {
      /*
       * On comparait un COMPTE de pages a un INDEX base sur zero. Sur la derniere page
       * reelle, `pageNumber` vaut `totalPages - 1`, la condition restait vraie, et une
       * page `totalPages` etait demandee au serveur a chaque fin de defilement : un
       * aller-retour inutile, systematique, sur un ecran qu'on fait defiler toute la
       * journee. La requete d'archives, elle, comparait juste.
       */
      const resteUnePage = lastPage.totalPages > lastPage.pageable.pageNumber + 1;
      return resteUnePage ? lastPage.pageable.pageNumber + 1 : undefined;
    },
    getPreviousPageParam: (firstPage: PaginatedResponse<BonLivraisonTerminee>) => {
      const hasPreviousPage = firstPage.pageable.pageNumber > 0;
      return hasPreviousPage ? firstPage.pageable.pageNumber - 1 : undefined;
    },
  };
};

//2- Hook pour récupérer les actualités
export const useTicketsInfiniteQuery = (ticketsParamsDTO: ITicketParams) => {
  /*
   * UN CODE CHECK LEVE LA PERIODE, ET RIEN D'AUTRE.
   *
   * <p>Un code est unique et se cherche dans toute l'archive : l'enfermer dans la semaine
   * affichee le rendrait introuvable. Le livreur et le partenaire, eux, ne font que
   * restreindre, et ils RESTENT. Les effacer avait deux consequences que personne ne voyait :
   * le filtre « Livreur » s'affichait toujours actif alors qu'il ne partait plus, et les
   * cartes de statistiques comme le fichier exporte, qui lisent les memes filtres sans les
   * effacer, decrivaient un autre ensemble que le tableau.</p>
   *
   * <p>⚠ Et on COPIE. L'objet recu est le `useMemo` de l'appelant : le muter corrompait
   * l'etat de filtre partage par l'ecran entier, au premier rendu, en silence.</p>
   */
  const params: ITicketParams = ticketsParamsDTO.search?.trim()
    ? { ...ticketsParamsDTO, debut: undefined, fin: undefined }
    : ticketsParamsDTO;

  const query = useInfiniteQuery(ticketsInfiniteQueryOption(params));

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      toast.error('Erreur lors de la récupération des tickets: ' + (query.error instanceof Error ? query.error.message : 'Erreur inconnue'));
    }
  }, [query.isError, query.error]);

  return query;
};

//3. Prefetch de la liste des actualités
export const prefetchTicketsInfiniteQuery = (ticketsParamsDTO: ITicketParams) => {
  return queryClient.prefetchInfiniteQuery(ticketsInfiniteQueryOption(ticketsParamsDTO));
};
