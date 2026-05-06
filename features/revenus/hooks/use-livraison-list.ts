"use client";

// hooks/useInvestissementList.ts
import { useMemo, useCallback } from "react";
import { useQueryStates } from 'nuqs';
import { livraisonFiltersClient } from "../filters/livraison.filter";
import { ILivraison, ILivraisonParams } from "../types/livraison.types";
import { useLivraisonListQuery } from "../queries/livraison/livraison-list.query";
import { useGlobalFilterListener } from "@/hooks/use-global-filter-listener";

export interface IUseLivraisonListProps {
    initialData?: ILivraison[];
}

export function useLivraisonList({ initialData = [] }: IUseLivraisonListProps = {}) {
    // Gestion des paramètres d'URL via Nuqs
    const [filters, setFilters] = useQueryStates(livraisonFiltersClient.filter, livraisonFiltersClient.option);

    // Écouter les filtres globaux de la navbar
    useGlobalFilterListener({
        moduleName: 'livraison',
        onFilterChange: (globalFilters) => {
            // Appliquer les filtres globaux aux filtres locaux
            setFilters(prev => ({
                ...prev,
                ...globalFilters,
                page: 1, // Reset à la première page quand on filtre
            }));
        },
        onFilterClear: () => {
            // Réinitialiser tous les filtres
            setFilters(prev => ({
                ...prev,
                search: '',
                nomLivreur: '',
                nomRestaurant: '',
                createdAt: '',
                fraisLivraison: 0,
                statut: '',
                dateLivraison: '',
                page: 1,
            }));
        }
    });

    // Construction des paramètres de recherche
    const currentSearchParams: ILivraisonParams = useMemo(() => {
        const params: ILivraisonParams = {
            page: filters.page,
            limit: filters.limit,
            nomLivreur: filters.nomLivreur,
            nomRestaurant: filters.nomRestaurant,
            createdAt: filters.createdAt,
            fraisLivraison: filters.fraisLivraison,
            dateLivraison: filters.dateLivraison,
        };
        
        // Ajouter le search seulement s'il n'est pas vide
        if (filters.search) {
            params.search = filters.search;
        }
        
        return params;
    }, [filters]);

    // Récupération des données via la query
    const { data, isLoading, isError, error, isFetching } = useLivraisonListQuery(currentSearchParams);

    const livraisons = data || initialData;

    // Fonction pour gérer les changements de filtres
    const handleFilterChange = useCallback((filterName: string, value: string | number) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value,
            page: 1, // Reset à la première page quand on filtre
        }));
    }, [setFilters]);

    // Fonction pour gérer les changements de pagination
    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({
            ...prev,
            page,
        }));
    }, [setFilters]);

    // Fonction pour gérer les changements de limite
    const handleLimitChange = useCallback((limit: number) => {
        setFilters(prev => ({
            ...prev,
            limit,
            page: 1, // Reset à la première page quand on change la limite
        }));
    }, [setFilters]);

    return {
        livraisons,
        isLoading: isLoading || isFetching,
        isError,
        error,
        filters,
        handleFilterChange,
        handlePageChange,
        handleLimitChange,
    };
}