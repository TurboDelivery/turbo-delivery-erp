// "use client"

// import { useState, useCallback, useMemo } from "react"
// import { FilterOption } from "@/components/filters/global-filter"

// export interface GlobalFilterState {
//   [key: string]: any
// }

// export function useGlobalFilter(initialFilters: FilterOption[]) {
//   const [filterState, setFilterState] = useState<GlobalFilterState>(() => {
//     const initialState: GlobalFilterState = {}
//     initialFilters.forEach(filter => {
//       initialState[filter.id] = filter.value
//     })
//     return initialState
//   })

//   const updateFilter = useCallback((filterId: string, value: any) => {
//     setFilterState(prev => ({
//       ...prev,
//       [filterId]: value
//     }))
//   }, [])

//   const clearFilters = useCallback(() => {
//     setFilterState(prev => {
//       const clearedState: GlobalFilterState = {}
//       initialFilters.forEach(filter => {
//         clearedState[filter.id] = undefined
//       })
//       return clearedState
//     })
//   }, [initialFilters])

//   const clearSpecificFilter = useCallback((filterId: string) => {
//     setFilterState(prev => ({
//       ...prev,
//       [filterId]: undefined
//     }))
//   }, [])

//   const getActiveFilters = useCallback(() => {
//     return Object.entries(filterState).filter(([_, value]) => 
//       value !== undefined && value !== '' && value !== 0 && value !== null
//     )
//   }, [filterState])

//   const getActiveFiltersCount = useCallback(() => {
//     return getActiveFilters().length
//   }, [getActiveFilters])

//   const hasActiveFilters = useCallback(() => {
//     return getActiveFiltersCount() > 0
//   }, [getActiveFiltersCount])

//   const getFilterValue = useCallback((filterId: string) => {
//     return filterState[filterId]
//   }, [filterState])

//   const getFilterQuery = useCallback(() => {
//     const query: any = {}
//     Object.entries(filterState).forEach(([key, value]) => {
//       if (value !== undefined && value !== '' && value !== 0 && value !== null) {
//         query[key] = value
//       }
//     })
//     return query
//   }, [filterState])

//   const resetToDefaults = useCallback(() => {
//     setFilterState(prev => {
//       const resetState: GlobalFilterState = {}
//       initialFilters.forEach(filter => {
//         resetState[filter.id] = filter.value
//       })
//       return resetState
//     })
//   }, [initialFilters])

//   const areFiltersDefault = useCallback(() => {
//     return initialFilters.every(filter => 
//       filterState[filter.id] === filter.value
//     )
//   }, [filterState, initialFilters])

//   const exportFilters = useCallback(() => {
//     return {
//       state: filterState,
//       activeFilters: getActiveFilters(),
//       activeCount: getActiveFiltersCount(),
//       query: getFilterQuery(),
//       hasActive: hasActiveFilters()
//     }
//   }, [filterState, getActiveFilters, getActiveFiltersCount, getFilterQuery, hasActiveFilters])

//   const importFilters = useCallback((newState: GlobalFilterState) => {
//     setFilterState(newState)
//   }, [])

//   return {
//     // State
//     filterState,
    
//     // Actions
//     updateFilter,
//     clearFilters,
//     clearSpecificFilter,
//     resetToDefaults,
//     importFilters,
    
//     // Getters
//     getFilterValue,
//     getActiveFilters,
//     getActiveFiltersCount,
//     hasActiveFilters,
//     getFilterQuery,
//     areFiltersDefault,
    
//     // Export
//     exportFilters
//   }
// }
