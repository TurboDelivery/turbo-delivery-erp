import { useState, useMemo } from 'react';
import { IConge, ICongesParams, CongeType, CongeStatut } from '../types/conge.type';
import { congeQueryKeys } from '../queries/conge.query';

export interface UseCongeTableParams {
  initialParams?: ICongesParams;
  itemsPerPage?: number;
}

export const useCongeTable = ({ 
  initialParams = {}, 
  itemsPerPage = 10 
}: UseCongeTableParams = {}) => {
  const [params, setParams] = useState<ICongesParams>({
    page: 0,
    limit: itemsPerPage,
    orderBy: 'createdAt',
    orderDirection: 'desc',
    ...initialParams,
  });

  const [selectedConges, setSelectedConges] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    type: '' as CongeType | '',
    statut: '' as CongeStatut | '',
  });

  // Computed values
  const computedParams = useMemo(() => {
    const newParams: ICongesParams = { ...params };
    
    // Appliquer les filtres
    if (filters.search) {
      newParams.search = filters.search;
    }
    if (filters.type) {
      newParams.type = filters.type;
    }
    if (filters.statut) {
      newParams.statut = filters.statut;
    }
    
    return newParams;
  }, [params, filters]);

  // Actions
  const updateParams = (newParams: Partial<ICongesParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset page to 0 when filters change
    updateParams({ page: 0 });
  };

  const nextPage = () => {
    updateParams({ page: (params.page || 0) + 1 });
  };

  const prevPage = () => {
    updateParams({ page: Math.max(0, (params.page || 0) - 1) });
  };

  const toggleCongeSelection = (congeId: string) => {
    setSelectedConges(prev => 
      prev.includes(congeId) 
        ? prev.filter(id => id !== congeId)
        : [...prev, congeId]
    );
  };

  const selectAllConges = (congeIds: string[]) => {
    setSelectedConges(congeIds);
  };

  const clearSelection = () => {
    setSelectedConges([]);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      type: '' as CongeType | '',
      statut: '' as CongeStatut | '',
    });
    updateParams({ page: 0 });
  };

  return {
    // State
    params,
    computedParams,
    selectedConges,
    filters,
    
    // Computed
    currentPage: params.page || 0,
    totalPages: 0, // Will be calculated from API response
    totalItems: 0, // Will be calculated from API response
    
    // Actions
    updateParams,
    updateFilters,
    nextPage,
    prevPage,
    toggleCongeSelection,
    selectAllConges,
    clearSelection,
    resetFilters,
    
    // Query key for React Query
    queryKey: congeQueryKeys.list(computedParams),
  };
};
