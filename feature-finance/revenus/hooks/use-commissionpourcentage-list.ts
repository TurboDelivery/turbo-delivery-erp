
"use client";

// hooks/useInvestissementList.ts
import { useMemo, useCallback } from "react";
import { useQueryStates } from 'nuqs';
import { commissionFiltersClient } from '../filters/commission.filter';
import { ICommission, ICommissionParams } from '../types/commission.types';
import { useCommissionPourcentageListQuery } from "../queries/commission/commissionpourcentage-list.query";

export interface IUseCommissionPourcentageListProps {
    initialData?: ICommission[];
}

export function useCommissionPourcentageList({ initialData = [] }: IUseCommissionPourcentageListProps = {}) {
    // Gestion des paramètres d'URL via Nuqs
    const [filters, setFilters] = useQueryStates(commissionFiltersClient.filter, commissionFiltersClient.option);

    // Construction des paramètres de recherche
    const currentSearchParams: ICommissionParams = useMemo(() => {
        const params: ICommissionParams = {
            page: filters.page,
            limit: filters.limit,
            nomRestaurant: filters.nomRestaurant,
            createdAt: filters.createdAt,
        };
        
        // Ajouter le search seulement s'il n'est pas vide
        if (filters.search) {
            params.search = filters.search;
            params.nomRestaurant = filters.nomRestaurant;
            params.createdAt = filters.createdAt;
        }
        
        return params;
    }, [filters]);

    // Récupération des données via la query
    const { data, isLoading, isError, error, isFetching } = useCommissionPourcentageListQuery(currentSearchParams);

    const commissionspourcentage = data || initialData;

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
        commissionspourcentage,
        isLoading: isLoading || isFetching,
        isError,
        error,
        filters,
        handleFilterChange,
        handlePageChange,
        handleLimitChange,
    };
}