"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

// Interface pour les filtres universels
export interface UniversalFilterState {
  search: string
  restaurantId: string
  dateFilter: string
  montantFilter: number
  statutFilter: string
  periode: string
}

// Interface pour le mapping des filtres par module
export interface FilterMapping {
  [module: string]: {
    [key: string]: string
  }
}

// Mapping des filtres de la navbar vers les paramètres d'API
const FILTER_MAPPING: FilterMapping = {
  recouvrement: {
    search: 'search',
    restaurant: 'restaurantId',
    periode: 'dateRecouvrement',
    statut: 'statut',
    montant: 'montant'
  },
  depense: {
    search: 'description',
    restaurant: 'restaurantId',
    periode: 'dateDepense',
    categorie: 'categorie',
    montant: 'montant'
  },
  pret: {
    search: 'search',
    restaurant: 'restaurantId',
    periode: 'dateRecouvrement',
    statut: 'statut',
    montant: 'montant'
  },
  livraison: {
    search: 'search',
    restaurant: 'restaurantId',
    periode: 'dateLivraison',
    statut: 'statut',
    montant: 'montant'
  },
  investissement: {
    search: 'nomInvestisseur',
    restaurant: 'restaurantId',
    periode: 'dateInvestissement',
    deadline: 'deadline',
    statut: 'statut',
    montant: 'montant'
  },
  commission: {
    search: 'search',
    nomRestaurant: 'nomRestaurant',
    createdAt: 'createdAt',
    statut: 'statut',
    montant: 'montant'
  }
}

export function useUniversalFilter() {
  const [filterState, setFilterState] = useState<UniversalFilterState>({
    search: '',
    restaurantId: '',
    dateFilter: '',
    montantFilter: 0,
    statutFilter: '',
    periode: ''
  })

  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Mettre à jour le compteur de filtres actifs
  const updateActiveFiltersCount = useCallback(() => {
    const count = Object.values(filterState).filter(value => 
      value !== '' && value !== 0 && value !== null && value !== undefined
    ).length
    setActiveFiltersCount(count)
  }, [filterState])

  // Effet pour mettre à jour le compteur quand l'état change
  useEffect(() => {
    updateActiveFiltersCount()
  }, [filterState, updateActiveFiltersCount])

  // Mettre à jour un filtre spécifique
  const updateFilter = useCallback((filterName: keyof UniversalFilterState, value: any) => {
    setFilterState(prev => ({
      ...prev,
      [filterName]: value
    }))
  }, [])

  // Appliquer un filtre et émettre un événement global
  const applyFilter = useCallback((filterName: string, value: any) => {
    // Mettre à jour l'état local
    const key = filterName as keyof UniversalFilterState
    updateFilter(key, value)

    // Émettre un événement global pour tous les modules
    window.dispatchEvent(new CustomEvent('universalFilterChange', {
      detail: { filterName, value }
    }))
  }, [updateFilter])

  // Effacer tous les filtres
  const clearAllFilters = useCallback(() => {
    setFilterState({
      search: '',
      restaurantId: '',
      dateFilter: '',
      montantFilter: 0,
      statutFilter: '',
      periode: ''
    })

    // Émettre un événement global pour effacer les filtres
    window.dispatchEvent(new CustomEvent('universalFilterClear', {}))
  }, [])

  // Effacer un filtre spécifique
  const clearSpecificFilter = useCallback((filterName: keyof UniversalFilterState) => {
    updateFilter(filterName, filterName === 'montantFilter' ? 0 : '')
    
    // Émettre un événement pour effacer ce filtre spécifique
    window.dispatchEvent(new CustomEvent('universalFilterSpecificClear', {
      detail: { filterName }
    }))
  }, [updateFilter])

  // Obtenir les paramètres de filtre pour un module spécifique
  const getModuleFilters = useCallback((module: string) => {
    const moduleMapping = FILTER_MAPPING[module] || {}
    const moduleFilters: any = {}

    Object.entries(filterState).forEach(([key, value]) => {
      if (value !== '' && value !== 0 && value !== null && value !== undefined) {
        // Trouver le mapping correspondant
        const mappedKey = moduleMapping[key] || key
        
        // Validation spécifique pour le module commission
        if (module === 'commission') {
          // N'autoriser que les paramètres spécifiques aux commissions
          const allowedParams = ['search', 'nomRestaurant', 'createdAt', 'statut', 'montant']
          if (!allowedParams.includes(mappedKey)) {
            return // Ignorer ce paramètre
          }
        }
        
        // Conversion spéciale pour les périodes
        if (key === 'periode' && value) {
          moduleFilters[mappedKey] = mapPeriodToDate(value)
        } else {
          moduleFilters[mappedKey] = value
        }
      }
    })

    return moduleFilters
  }, [filterState])

  // Mapper les périodes en dates
  const mapPeriodToDate = useCallback((period: string): string => {
    const today = new Date()
    
    switch (period) {
      case 'today':
        return today.toISOString().split('T')[0]
      case 'week':
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        return startOfWeek.toISOString().split('T')[0]
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        return startOfMonth.toISOString().split('T')[0]
      case 'year':
        const startOfYear = new Date(today.getFullYear(), 0, 1)
        return startOfYear.toISOString().split('T')[0]
      default:
        return ''
    }
  }, [])

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = useCallback(() => {
    return activeFiltersCount > 0
  }, [activeFiltersCount])

  // Exporter l'état des filtres
  const exportFilters = useCallback(() => {
    return {
      state: filterState,
      activeCount: activeFiltersCount,
      hasActive: hasActiveFilters()
    }
  }, [filterState, activeFiltersCount, hasActiveFilters])

  // Nettoyer les filtres pour un module spécifique
  const clearModuleFilters = useCallback((module: string) => {
    // Pour le module commission, effacer spécifiquement les paramètres non désirés
    if (module === 'commission') {
      setFilterState(prev => ({
        ...prev,
        // Effacer les paramètres qui ne sont pas utilisés par les commissions
        restaurantId: '',
        dateFilter: '',
        periode: '',
        // Garder les paramètres pertinents pour les commissions
        search: prev.search,
        montantFilter: prev.montantFilter,
        statutFilter: prev.statutFilter
      }))
    }
  }, [])

  // Importer un état de filtres
  const importFilters = useCallback((newState: Partial<UniversalFilterState>) => {
    setFilterState(prev => ({
      ...prev,
      ...newState
    }))
  }, [])

  // Nettoyer les filtres lors du changement de module
  const clearFiltersOnModuleChange = useCallback((newModule: string) => {
    clearModuleFilters(newModule)
  }, [clearModuleFilters])

  return {
    // État
    filterState,
    activeFiltersCount,
    hasActiveFilters,
    
    // Actions
    applyFilter,
    clearAllFilters,
    clearSpecificFilter,
    clearModuleFilters,
    importFilters,
    clearFiltersOnModuleChange,
    
    // Utilitaires
    getModuleFilters,
    mapPeriodToDate,
    exportFilters
  }
}
