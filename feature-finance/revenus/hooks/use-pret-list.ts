"use client";

// hooks/useInvestissementList.ts
import { useState, useMemo, useCallback } from "react";
import { useQuery } from '@tanstack/react-query';
import { useQueryStates } from 'nuqs';
import { IFacture, IFactureParams } from '../types/recouvrement/prets.types';
import { usePretListQuery } from "../queries/prets/pret-list.query";
import { useGlobalFilterListener } from "@/hooks/use-global-filter-listener";

// Définition des parsers pour nuqs
const pretFiltersParsers = {
    page: {
        defaultValue: 1,
        parse: (value: string) => parseInt(value) || 1,
        serialize: (value: number) => value.toString(),
    },
    limit: {
        defaultValue: 10,
        parse: (value: string) => parseInt(value) || 10,
        serialize: (value: number) => value.toString(),
    },
    search: {
        defaultValue: '',
        parse: (value: string) => value || '',
        serialize: (value: string) => value,
    },
    nomRestaurant: {
        defaultValue: '',
        parse: (value: string) => value || '',
        serialize: (value: string) => value,
    },
    selectedRestaurants: {
        defaultValue: [] as string[],
        parse: (value: string) => value ? value.split(',').filter(Boolean) : [],
        serialize: (value: string[]) => value.join(','),
    },
};

export interface IUsePretListProps {
    initialData?: IFacture[];
}

export function usePretList({ initialData = [] }: IUsePretListProps = {}) {
    // État des filtres avec nuqs (URL query parameters)
    const [filters, setFilters] = useQueryStates(pretFiltersParsers);

    // Construction des paramètres de recherche pour l'API
    const apiParams: IFactureParams = {
        page: 1,
        limit: 1000, // Obtenir toutes les données pour le filtrage côté client
        search: filters.search || undefined,
    };

    // Écouter les filtres globaux de la navbar
    useGlobalFilterListener({
        moduleName: 'pret',
        onFilterChange: (globalFilters) => {
            // Appliquer les filtres globaux aux filtres nuqs
            setFilters(prev => ({
                ...prev,
                ...globalFilters,
                page: 1, // Reset à la première page quand on filtre
            }));
        },
        onFilterClear: () => {
            // Réinitialiser tous les filtres
            setFilters({
                page: 1,
                limit: 10,
                search: '',
                nomRestaurant: '',
                selectedRestaurants: [],
            });
        }
    });

    // Utiliser React Query pour récupérer TOUTES les données
    const { data: queryData, isLoading, isError, error, isFetching } = usePretListQuery(apiParams);

    // Toutes les données (non filtrées)
    const allFactures: IFacture[] = queryData || initialData;

    // Filtrage côté client
    const facture = useMemo(() => {
        let filtered = allFactures;
        
        // Filtrer par restaurant (mono-sélection)
        if (filters.nomRestaurant) {
            filtered = filtered.filter((facture: IFacture) => 
                facture.nomRestaurant?.toLowerCase().includes(filters.nomRestaurant.toLowerCase())
            );
        }
        
        // Filtrer par restaurants (multi-sélection)
        if (filters.selectedRestaurants && filters.selectedRestaurants.length > 0) {
            filtered = filtered.filter((facture: IFacture) => 
                filters.selectedRestaurants!.includes(facture.nomRestaurant)
            );
        }
        
        return filtered;
    }, [allFactures, filters]);

    // Fonction pour gérer les changements de filtres
    const handleFilterChange = useCallback((filterName: string, value: string | number | string[]) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value,
            page: 1, // Reset à la première page quand on filtre
        }));
    }, [setFilters]);

    // Fonction pour réinitialiser tous les filtres
    const resetFilters = useCallback(() => {
        setFilters({
            page: 1,
            limit: 10,
            search: '',
            nomRestaurant: '',
            selectedRestaurants: [],
        });
    }, [setFilters]);

    // Fonction pour réinitialiser un filtre spécifique
    const resetFilter = useCallback((filterName: string) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: filterName === 'limit' ? 10 : filterName === 'selectedRestaurants' ? [] : '',
            page: 1,
        }));
    }, [setFilters]);

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