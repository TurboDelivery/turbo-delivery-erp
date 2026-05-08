"use client"

import { useEffect, useCallback } from "react"

export interface GlobalFilterEvent {
  filterName: string
  value: any
}

export interface UseGlobalFilterListenerOptions {
  moduleName: string
  onFilterChange?: (filters: Record<string, any>) => void
  onFilterClear?: () => void
  enabled?: boolean
}

export function useGlobalFilterListener(options: UseGlobalFilterListenerOptions) {
  const {
    moduleName,
    onFilterChange,
    onFilterClear,
    enabled = true
  } = options

  const handleFilterChange = useCallback((event: CustomEvent<GlobalFilterEvent>) => {
    if (!enabled) return
    const { filterName, value } = event.detail
    const mappedFilters = mapUniversalFilterToModule(filterName, value, moduleName)
    if (onFilterChange && Object.keys(mappedFilters).length > 0) {
      onFilterChange(mappedFilters)
    }
  }, [moduleName, onFilterChange, enabled])

  const handleFilterClear = useCallback(() => {
    if (!enabled) return
    if (onFilterClear) onFilterClear()
  }, [onFilterClear, enabled])

  const handleSpecificFilterClear = useCallback((event: CustomEvent<{ filterName: string }>) => {
    if (!enabled) return
    const { filterName } = event.detail
    const mappedFilters = mapUniversalFilterToModule(filterName, '', moduleName)
    if (onFilterChange && Object.keys(mappedFilters).length > 0) {
      onFilterChange(mappedFilters)
    }
  }, [moduleName, onFilterChange, enabled])

  const mapUniversalFilterToModule = useCallback((filterName: string, value: any, module: string): Record<string, any> => {
    const mapping: Record<string, Record<string, string>> = {
      recouvrement: { search: 'search', restaurant: 'restaurantId', periode: 'dateRecouvrement', statut: 'statut', montant: 'montant', dateDebut: 'dateDebut', dateFin: 'dateFin' },
      depense: { search: 'description', restaurant: 'restaurantId', periode: 'dateDepense', statut: 'statut', montant: 'montant', dateDebut: 'dateDebut', dateFin: 'dateFin' },
      pret: { search: 'search', restaurant: 'restaurantId', periode: 'dateRecouvrement', statut: 'statut', montant: 'montant', dateDebut: 'dateDebut', dateFin: 'dateFin' },
      livraison: { search: 'nomLivreur', restaurant: 'restaurantId', periode: 'dateLivraison', statut: 'statut', montant: 'montant', dateLivraison: 'dateLivraison' },
      investissement: { search: 'search', restaurant: 'restaurantId', periode: 'dateInvestissement', statut: 'statut', montant: 'montant', dateDebut: 'dateDebut', dateFin: 'dateFin' },
      commission: { search: 'search', restaurant: 'restaurantId', periode: 'dateCommission', statut: 'statut', montant: 'montant', dateDebut: 'dateDebut', dateFin: 'dateFin' },
    }
    const moduleMapping = mapping[module] || {}
    const mappedKey = moduleMapping[filterName] || filterName
    if (filterName === 'periode' && value) return { [mappedKey]: mapPeriodToDate(value) }
    if ((filterName === 'restaurant' || filterName === 'statut') && value === 'all') return { [mappedKey]: '' }
    return { [mappedKey]: value }
  }, [])

  const mapPeriodToDate = useCallback((period: string): string => {
    const today = new Date()
    switch (period) {
      case 'today': return today.toISOString().split('T')[0]
      case 'week': { const d = new Date(today); d.setDate(today.getDate() - today.getDay()); return d.toISOString().split('T')[0] }
      case 'month': return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      case 'quarter': return new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1).toISOString().split('T')[0]
      case 'year': return new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
      default: return ''
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    window.addEventListener('universalFilterChange', handleFilterChange as EventListener)
    window.addEventListener('universalFilterClear', handleFilterClear)
    window.addEventListener('universalFilterSpecificClear', handleSpecificFilterClear as EventListener)
    return () => {
      window.removeEventListener('universalFilterChange', handleFilterChange as EventListener)
      window.removeEventListener('universalFilterClear', handleFilterClear)
      window.removeEventListener('universalFilterSpecificClear', handleSpecificFilterClear as EventListener)
    }
  }, [handleFilterChange, handleFilterClear, handleSpecificFilterClear, enabled])

  return {}
}
