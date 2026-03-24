import React from "react";

import {addToast} from "@heroui/toast";
import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {X} from "lucide-react";
import {utilisateurAPI} from "../apis/utilisateur.api";
import {IUtilisateur, IUtilisateursParams} from "../types/utilisateur.type";
import {utilisateurKeyQuery} from "./index.query";
import {PaginatedResponse} from "@/types/api.type";

// Hook pour récupérer les utilisateurs
export const useUtilisateursListQuery = (
  utilisateursParamsDTO: IUtilisateursParams
) => {
  const query = useQuery({
    queryKey: utilisateurKeyQuery("list", utilisateursParamsDTO),
    queryFn: async () => {
      return await utilisateurAPI.obtenirTousUtilisateurs(utilisateursParamsDTO);
    },
    placeholderData: (previousData: any) => previousData,
    staleTime: 30 * 1000, //30 secondes
    refetchOnMount: true, //Refetch lors du mount
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      addToast({
        title: "Erreur lors de la récupération des utilisateurs:",
        description:
          query.error instanceof Error
            ? query.error.message
            : "Erreur inconnue",
        icon: <X />,
        color: "danger",
      });
    }
  }, [query]);

  return query;
};

// Hook pour récupérer les utilisateurs avec pagination infinie
export const useUtilisateursInfinityQuery = (
  utilisateursParamsDTO: IUtilisateursParams
) => {
  const query = useInfiniteQuery(
   {
    queryKey: utilisateurKeyQuery("list", utilisateursParamsDTO),
    queryFn: async ({ pageParam = 1 }) => {
       const result = await utilisateurAPI.obtenirTousUtilisateurs({
        ...utilisateursParamsDTO,
        page: pageParam,
      });
            return result;
    },

    initialPageParam: 1,

    getNextPageParam: (lastPage: PaginatedResponse<IUtilisateur>) => {
      const hasNextPage = lastPage.totalPages > lastPage.page;
      return hasNextPage ? lastPage.page + 1 : undefined;
    },
  }
  );

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      addToast({
        title: "Erreur lors de la récupération des utilisateurs:",
        description:
          query.error instanceof Error
            ? query.error.message
            : "Erreur inconnue",
        icon: <X />,
        color: "danger",
      });
    }
  }, [query]);

  return query;
};

// Hook pour récupérer un utilisateur
export const useUtilisateurQuery = (id: string) => {
  const query = useQuery({
    queryKey: utilisateurKeyQuery("detail", id),
    queryFn: async () => {
      if (!id) throw new Error("L'identifiant utilisateur est requis");

      const result = await utilisateurAPI.obtenirUtilisateur(id);

      return result;
    },
    enabled: !!id,
  });

  // Gestion des erreurs dans le hook
  React.useEffect(() => {
    if (query.isError && query.error) {
      addToast({
        title: "Erreur lors de la récupération de l'utilisateur:",
        description:
          query.error instanceof Error
            ? query.error.message
            : "Erreur inconnue",
        icon: <X />,
        color: "danger",
      });
    }
  }, [query.isError, query.error]);

  return query;
};
