
"use client"
import { useMemo, useCallback, useState } from "react";
import { IInvestissement, IInvestissementParams } from '../types/revenus.types';
import { useInvestissementListQuery } from "../queries/investissement/investissement-list.query";

export interface IUseInvestissementListProps {
    initialData?: IInvestissement[];
}

export interface InvestissementFilters {
    nomInvestisseur: string;
    dateInvestissement: string;
    deadline: string;
    montant: number;
    page: number;
    limit: number;
}

const initialFilters: InvestissementFilters = {
    nomInvestisseur: '',
    dateInvestissement: '',
    deadline: '',
    montant: 0,
    page: 1,
    limit: 10,
};

export function useInvestissementList({ initialData = [] }: IUseInvestissementListProps = {}) {
    // Gestion des filtres avec useState
    const [filters, setFilters] = useState<InvestissementFilters>(initialFilters);

    // Construction des paramètres de recherche
    const currentSearchParams: IInvestissementParams = useMemo(() => {
        const params: IInvestissementParams = {
            page: filters.page,
            limit: filters.limit,
        };
        
        // Ajouter les paramètres de filtre seulement s'ils ne sont pas vides
        if (filters.nomInvestisseur && filters.nomInvestisseur.trim() !== '') {
            params.nomInvestisseur = filters.nomInvestisseur;
        }
        
        if (filters.dateInvestissement && filters.dateInvestissement.trim() !== '') {
            params.dateInvestissement = filters.dateInvestissement;
        }
        
        if (filters.deadline && filters.deadline.trim() !== '') {
            params.deadline = filters.deadline;
        }
        
        if (filters.montant && filters.montant > 0) {
            params.montant = filters.montant;
        }
        
        console.log('Params envoyés à la query:', params);
        return params;
    }, [filters]);

    // Récupération des données via la query
    const { data, isLoading, isError, error, isFetching } = useInvestissementListQuery(currentSearchParams);

    // Fonction pour mettre à jour les filtres
    const updateFilters = useCallback((newFilters: Partial<InvestissementFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Fonction pour gérer les changements de filtres
    const handleFilterChange = useCallback((filterName: keyof InvestissementFilters, value: string | number) => {
        console.log('Changement de filtre:', filterName, value);
        
        // Vérifier le type attendu pour chaque propriété
        let typedValue: string | number;
        
        if (filterName === 'page' || filterName === 'limit' || filterName === 'montant') {
            // Convertir en nombre si nécessaire
            typedValue = typeof value === 'string' ? Number(value) : value;
        } else {
            // Garder comme string pour les autres propriétés
            typedValue = String(value);
        }
        
        updateFilters({ 
            [filterName]: typedValue,
            page: filterName !== 'page' ? 1 : (typeof value === 'string' ? Number(value) : value),
        });
    }, [updateFilters]);

    return {
        investissements: data || initialData,
        isLoading: isLoading || isFetching,
        isError,
        error,
        filters,
        handleFilterChange,
        updateFilters,
        handlePageChange: (page: number) => handleFilterChange('page', page),
        handleLimitChange: (limit: number) => handleFilterChange('limit', limit),
        resetFilters: () => setFilters(initialFilters),
    };
}