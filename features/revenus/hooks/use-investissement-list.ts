'use client';
import { useCallback, useMemo, useState } from 'react';
import { IInvestissementParams } from '../types/revenus.types';
import { useInvestissementListQuery } from '../queries/investissement/investissement-list.query';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface InvestissementFilters {
  nomInvestisseur: string;
  debut?: Date;
  fin?: Date;
  page: number;
  limit: number;
}

const initialFilters: InvestissementFilters = {
  nomInvestisseur: '',
  debut: startOfMonth(new Date()),
  fin: endOfMonth(new Date()),
  page: 0,
  limit: 10,
};

export function useInvestissementList() {
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

    if (filters.debut) {
      params.debut = filters.debut;
    }

    if (filters.fin) {
      params.fin = filters.fin;
    }

    return params;
  }, [filters]);

  // Récupération des données via la query
  const { data, isLoading, isError, error, isFetching, refetch } = useInvestissementListQuery(currentSearchParams);

  const pagination = {
    pageCount: data?.totalPages || 0,
    totalItems: data?.totalElements || 0,
    page: filters?.page ?? 0,
    handlePageChange: (page: number) => {
      setFilters((prev) => ({
        ...prev,
        page: page,
      }));
    },
  };

  // Fonction pour mettre à jour les filtres
  const updateFilters = useCallback((newFilters: Partial<InvestissementFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Fonction pour gérer les changements de filtres
  const handleFilterChange = useCallback(
    (filterName: keyof InvestissementFilters, value: string | number) => {
      console.log('Changement de filtre:', filterName, value);

      // Vérifier le type attendu pour chaque propriété
      let typedValue: string | number;

      if (filterName === 'page' || filterName === 'limit') {
        // Convertir en nombre si nécessaire
        typedValue = typeof value === 'string' ? Number(value) : value;
      } else {
        // Garder comme string pour les autres propriétés
        typedValue = String(value);
      }

      updateFilters({
        [filterName]: typedValue,
        page: filterName !== 'page' ? 0 : typeof value === 'string' ? Number(value) : value,
      });
    },
    [updateFilters],
  );

  // Fonction pour gérer les changements de dates
  const handleDateChange = useCallback(
    (value: { from?: Date; to?: Date } | undefined) => {
      if (value?.from && value?.to) {
        updateFilters({
          debut: value.from,
          fin: value.to,
          page: 0,
        });
      }
    },
    [updateFilters],
  );

  return {
    investissements: data?.content || [],
    isLoading: isLoading || isFetching,
    isError,
    error,
    // `isFetching` etait absorbe dans `isLoading` et il n'y avait pas de relance :
    // impossible pour un ecran d'afficher un echec et de proposer un reessai.
    isFetching,
    refetch,
    filters,
    handleFilterChange,
    handleDateChange,
    updateFilters,
    handlePageChange: (page: number) => handleFilterChange('page', page),
    handleLimitChange: (limit: number) => handleFilterChange('limit', limit),
    resetFilters: () => setFilters(initialFilters),
    pagination,
  };
}
