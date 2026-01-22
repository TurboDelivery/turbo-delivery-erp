"use client"

import { useEffect, useCallback } from "react"

// Interface pour les événements de filtre global
export interface GlobalFilterEvent {
  filterName: string
  value: any
}

// Interface pour les options du hook
export interface UseGlobalFilterListenerOptions {
  moduleName: string
  onFilterChange?: (filters: Record<string, any>) => void
  onFilterClear?: () => void
  enabled?: boolean
}

/**
 * Hook pour écouter les événements de filtre global
 * Permet à n'importe quel composant de réagir aux changements de filtres de la navbar
 */
export function useGlobalFilterListener(options: UseGlobalFilterListenerOptions) {
  const {
    moduleName,
    onFilterChange,
    onFilterClear,
    enabled = true
  } = options

  // Gérer les changements de filtres
  const handleFilterChange = useCallback((event: CustomEvent<GlobalFilterEvent>) => {
    if (!enabled) return

    const { filterName, value } = event.detail
    
    // Mapper les filtres universels vers les filtres spécifiques au module
    const mappedFilters = mapUniversalFilterToModule(filterName, value, moduleName)
    
    if (onFilterChange && Object.keys(mappedFilters).length > 0) {
      onFilterChange(mappedFilters)
    }
  }, [moduleName, onFilterChange, enabled])

  // Gérer l'effacement de tous les filtres
  const handleFilterClear = useCallback(() => {
    if (!enabled) return
    
    if (onFilterClear) {
      onFilterClear()
    }
  }, [onFilterClear, enabled])

  // Gérer l'effacement d'un filtre spécifique
  const handleSpecificFilterClear = useCallback((event: CustomEvent<{ filterName: string }>) => {
    if (!enabled) return

    const { filterName } = event.detail
    const mappedFilters = mapUniversalFilterToModule(filterName, '', moduleName)
    
    if (onFilterChange && Object.keys(mappedFilters).length > 0) {
      onFilterChange(mappedFilters)
    }
  }, [moduleName, onFilterChange, enabled])

  // Mapper les filtres universels vers les filtres spécifiques au module
  const mapUniversalFilterToModule = useCallback((filterName: string, value: any, module: string): Record<string, any> => {
    const mapping: Record<string, Record<string, string>> = {
      recouvrement: {
        search: 'search',
        restaurant: 'restaurantId',
        periode: 'dateRecouvrement',
        statut: 'statut',
        montant: 'montant',
        dateDebut: 'dateDebut',
        dateFin: 'dateFin'
      },
      depense: {
        search: 'description',
        restaurant: 'restaurantId',
        periode: 'dateDepense',
        statut: 'statut',
        montant: 'montant',
        dateDebut: 'dateDebut',
        dateFin: 'dateFin'
      },
      pret: {
        search: 'search',
        restaurant: 'restaurantId',
        periode: 'dateRecouvrement',
        statut: 'statut',
        montant: 'montant',
        dateDebut: 'dateDebut',
        dateFin: 'dateFin'
      },
      livraison: {
        search: 'nomLivreur',
        restaurant: 'restaurantId',
        periode: 'dateLivraison',
        statut: 'statut',
        montant: 'montant',
        dateLivraison: 'dateLivraison'
      },
      investissement: {
        search: 'search',
        restaurant: 'restaurantId',
        periode: 'dateInvestissement',
        statut: 'statut',
        montant: 'montant',
        dateDebut: 'dateDebut',
        dateFin: 'dateFin'
      },
      commission: {
        search: 'search',
        restaurant: 'restaurantId',
        periode: 'dateCommission',
        statut: 'statut',
        montant: 'montant',
        dateDebut: 'dateDebut',
        dateFin: 'dateFin'
      }
    }

    const moduleMapping = mapping[module] || {}
    const mappedKey = moduleMapping[filterName] || filterName

    // Conversion spéciale pour les périodes
    if (filterName === 'periode' && value) {
      return {
        [mappedKey]: mapPeriodToDate(value)
      }
    }

    // Conversion pour les restaurants
    if (filterName === 'restaurant' && value === 'all') {
      return {
        [mappedKey]: ''
      }
    }

    // Conversion pour les statuts
    if (filterName === 'statut' && value === 'all') {
      return {
        [mappedKey]: ''
      }
    }

    return {
      [mappedKey]: value
    }
  }, [])

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
      case 'quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
        return quarterStart.toISOString().split('T')[0]
      case 'year':
        const startOfYear = new Date(today.getFullYear(), 0, 1)
        return startOfYear.toISOString().split('T')[0]
      default:
        return ''
    }
  }, [])

  // Effet pour ajouter les écouteurs d'événements
  useEffect(() => {
    if (!enabled) return

    // Écouter les événements de changement de filtres
    window.addEventListener('universalFilterChange', handleFilterChange as EventListener)
    
    // Écouter les événements d'effacement de tous les filtres
    window.addEventListener('universalFilterClear', handleFilterClear)
    
    // Écouter les événements d'effacement de filtres spécifiques
    window.addEventListener('universalFilterSpecificClear', handleSpecificFilterClear as EventListener)

    // Nettoyer les écouteurs lors du démontage
    return () => {
      window.removeEventListener('universalFilterChange', handleFilterChange as EventListener)
      window.removeEventListener('universalFilterClear', handleFilterClear)
      window.removeEventListener('universalFilterSpecificClear', handleSpecificFilterClear as EventListener)
    }
  }, [handleFilterChange, handleFilterClear, handleSpecificFilterClear, enabled])

  return {
    // Le hook ne retourne rien, il gère juste les événements
    // Les callbacks fournis dans les options seront appelés lorsque nécessaire
  }
}
