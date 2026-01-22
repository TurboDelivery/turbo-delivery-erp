"use client";

// hooks/useInvestissementList.ts
import { useState, useMemo, useCallback } from "react";
import { useQuery } from '@tanstack/react-query';
import { IFacture, IFactureParams } from '../types/recouvrement/prets.types';
import { usePretListQuery } from "../queries/prets/pret-list.query";
import { useGlobalFilterListener } from "@/hooks/use-global-filter-listener";

export interface IUsePretListProps {
    initialData?: IFacture[];
}

export function usePretList({ initialData = [] }: IUsePretListProps = {}) {
    // État local pour les filtres (sans Nuqs)
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: '',
        nomRestaurant: '',
    });

    // Construction des paramètres de recherche pour l'API (sans filtre de restaurant)
    const apiParams: IFactureParams = {
        page: 1,
        limit: 1000, // Obtenir toutes les données pour le filtrage côté client
        search: filters.search || undefined,
    };

    // Écouter les filtres globaux de la navbar
    useGlobalFilterListener({
        moduleName: 'pret',
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
                nomRestaurant: '',
                page: 1,
            }));
        }
    });

    // Utiliser React Query pour récupérer TOUTES les données
    const { data: queryData, isLoading, isError, error, isFetching } = usePretListQuery(apiParams);

    // Toutes les données (non filtrées)
    const allFactures: IFacture[] = queryData || initialData;

    // Filtrage côté client
    const facture = useMemo(() => {
        let filtered = allFactures;
        
        // Filtrer par restaurant
        if (filters.nomRestaurant) {
            filtered = filtered.filter((facture: IFacture) => 
                facture.nomRestaurant?.toLowerCase().includes(filters.nomRestaurant.toLowerCase())
            );
        }
        
        return filtered;
    }, [allFactures, filters]);

    // Fonction pour gérer les changements de filtres
    const handleFilterChange = useCallback((filterName: string, value: string | number) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value,
            page: 1, // Reset à la première page quand on filtre
        }));
    }, []);

    // Fonction pour réinitialiser tous les filtres
    const resetFilters = useCallback(() => {
        setFilters({
            page: 1,
            limit: 10,
            search: '',
            nomRestaurant: '',
        });
    }, []);

    // Fonction pour réinitialiser un filtre spécifique
    const resetFilter = useCallback((filterName: string) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: filterName === 'limit' ? 10 : '',
            page: 1,
        }));
    }, []);

    return {
        facture,
        allFactures,
        isLoading,
        isError,
        error,
        isFetching,
        filters,
        handleFilterChange,
        resetFilters,
        resetFilter,
        setFilters,
    };
}