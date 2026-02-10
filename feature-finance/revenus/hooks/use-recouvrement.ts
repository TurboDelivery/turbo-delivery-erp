'use client';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueryStates } from 'nuqs';
import { IRecouvrement, IRecouvrementParams } from '../types/recouvrement/recouvrement.types';
import { recouvrementListQueryOption } from '@/features/recouvrements/queries/recouvrement-list.query';

// Définition des parsers pour nuqs
const recouvrementFiltersParsers = {
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
  dateRecouvrement: {
    defaultValue: '',
    parse: (value: string) => value || '',
    serialize: (value: string) => value,
  },
  montant: {
    defaultValue: 0,
    parse: (value: string) => parseFloat(value) || 0,
    serialize: (value: number) => value.toString(),
  },
};

export interface IUseRecouvrementProps {
  initialData?: IRecouvrement[];
}

export function useRecouvrementList({ initialData = [] }: IUseRecouvrementProps = {}) {
  // État des filtres avec nuqs (URL query parameters)
  const [filters, setFilters] = useQueryStates(recouvrementFiltersParsers);

  // Construction des paramètres de recherche pour l'API
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
  const allRecouvrements: IRecouvrement[] = Array.isArray(queryData) ? queryData : queryData?.content || initialData;

  // Filtrage côté client
  const recouvrement = useMemo(() => {
    let filtered = allRecouvrements;

    // Filtrer par restaurant
    if (filters.nomRestaurant) {
      filtered = filtered.filter((rec: IRecouvrement) => {
        const factureRestaurant = allRecouvrements.find((r) => r.restaurantId === rec.restaurantId);
        return factureRestaurant?.nomRestaurant?.toLowerCase().includes(filters.nomRestaurant.toLowerCase());
      });
    }

    return filtered;
  }, [allRecouvrements, filters]);

  // Fonction pour gérer les changements de filtres
  const handleFilterChange = useCallback(
    (filterName: string, value: string | number) => {
      setFilters((prev) => ({
        ...prev,
        [filterName]: value,
        page: 1, // Reset à la première page quand on filtre
      }));
    },
    [setFilters],
  );

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
  }, [setFilters]);

  // Fonction pour réinitialiser un filtre spécifique
  const resetFilter = useCallback(
    (filterName: string) => {
      setFilters((prev) => ({
        ...prev,
        [filterName]: filterName === 'montant' ? 0 : '',
        page: 1,
      }));
    },
    [setFilters],
  );

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
