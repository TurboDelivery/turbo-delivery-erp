"use client"
import { useState, useMemo, useCallback } from "react";
import { useQuery } from '@tanstack/react-query';
import { IRecouvrement, IRecouvrementParams } from '../types/recouvrement/recouvrement.types';
import { recouvrementListQueryOption } from '../queries/recouvrement/recouvrement-list.query';

export interface IUseRecouvrementProps {
    initialData?: IRecouvrement[];
}

export function useRecouvrementList({ initialData = [] }: IUseRecouvrementProps = {}) {
    // État local pour les filtres
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: '',
        nomRestaurant: '',
        dateRecouvrement: '',
        montant: 0,
    });

    // Construction des paramètres de recherche pour l'API (sans filtre de restaurant)
    const apiParams: IRecouvrementParams = {
        page: 1,
        limit: 1000, // Obtenir toutes les données pour le filtrage côté client
        search: filters.search || undefined,
        dateRecouvrement: filters.dateRecouvrement || undefined,
        montant: filters.montant > 0 ? filters.montant : undefined,
    };

    // Utiliser React Query pour récupérer TOUTES les données
    const { data: queryData, isLoading, isError, error, isFetching } = useQuery(recouvrementListQueryOption(apiParams));

    // Toutes les données (non filtrées) - garantir que c'est un tableau
    const allRecouvrements: IRecouvrement[] = Array.isArray(queryData) ? queryData : (queryData?.data || initialData);

    // Filtrage côté client
    const recouvrement = useMemo(() => {
        let filtered = allRecouvrements;
        
        // Filtrer par restaurant
        if (filters.nomRestaurant) {
            filtered = filtered.filter((rec: IRecouvrement) => 
                rec.nomRestaurant?.toLowerCase().includes(filters.nomRestaurant.toLowerCase())
            );
        }
        
        return filtered;
    }, [allRecouvrements, filters]);

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
            dateRecouvrement: '',
            montant: 0,
        });
    }, []);

    // Fonction pour réinitialiser un filtre spécifique
    const resetFilter = useCallback((filterName: string) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: filterName === 'montant' ? 0 : '',
            page: 1,
        }));
    }, []);

    return {
        recouvrement,
        allRecouvrements,
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