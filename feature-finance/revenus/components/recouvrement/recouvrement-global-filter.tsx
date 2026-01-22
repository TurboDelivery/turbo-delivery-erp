// "use client"

// import { useMemo } from "react"
// import { useQuery } from "@tanstack/react-query"
// import GlobalFilter, { FilterOption } from "@/components/filters/global-filter"
// import { useGlobalFilter } from "@/hooks/use-global-filter"
// import { useRecouvrementList } from "@/feature/revenus/hooks/use-recouvrement"
// import { usePretList } from "@/feature/revenus/hooks/use-pret-list"
// // Interface simple pour les restaurants (à remplacer par le vrai type quand disponible)
// interface IRestaurant {
//   id: string;
//   nomRestaurant?: string;
//   name?: string;
// }

// // API pour récupérer la liste des restaurants
// const fetchRestaurants = async (): Promise<IRestaurant[]> => {
//   try {
//     const response = await fetch('/api/restaurants')
//     if (!response.ok) {
//       // Si l'API n'existe pas, retourner des données de démonstration
//       return [
//         { id: 'resto1', nomRestaurant: 'Restaurant Le Gourmet' },
//         { id: 'resto2', nomRestaurant: 'Café de la Paix' },
//         { id: 'resto3', nomRestaurant: 'Bistro Chic' },
//         { id: 'resto4', nomRestaurant: 'La Belle Époque' },
//       ]
//     }
//     return response.json()
//   } catch (error) {
//     // En cas d'erreur, retourner des données de démonstration
//     return [
//       { id: 'resto1', nomRestaurant: 'Restaurant Le Gourmet' },
//       { id: 'resto2', nomRestaurant: 'Café de la Paix' },
//       { id: 'resto3', nomRestaurant: 'Bistro Chic' },
//       { id: 'resto4', nomRestaurant: 'La Belle Époque' },
//     ]
//   }
// }

// interface RecouvrementGlobalFilterProps {
//   onFiltersChange?: (filterName: string, value: any) => void
//   className?: string
// }

// export default function RecouvrementGlobalFilter({ 
//   onFiltersChange, 
//   className = "" 
// }: RecouvrementGlobalFilterProps) {
//   const { data: restaurants = [] } = useQuery({
//     queryKey: ['restaurants'],
//     queryFn: fetchRestaurants,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   })

//   // Définir les options de filtre
//   const filterOptions: FilterOption[] = useMemo(() => [
//     {
//       id: 'periode',
//       label: 'Période',
//       value: undefined,
//       type: 'select',
//       placeholder: 'Sélectionner une période',
//       options: [
//         { value: 'today', label: "Aujourd'hui" },
//         { value: 'week', label: 'Cette semaine' },
//         { value: 'month', label: 'Ce mois' },
//         { value: 'quarter', label: 'Ce trimestre' },
//         { value: 'year', label: 'Cette année' },
//         { value: 'custom', label: 'Personnalisé' }
//       ]
//     },
//     {
//       id: 'restaurant',
//       label: 'Restaurant',
//       value: undefined,
//       type: 'select',
//       placeholder: 'Filtrer par restaurant',
//       options: [
//         { value: 'all', label: 'Tous les restaurants' },
//         ...restaurants.map(restaurant => ({
//           value: restaurant.id,
//           label: restaurant.nomRestaurant || restaurant.name || 'Restaurant sans nom'
//         }))
//       ]
//     },
//     {
//       id: 'dateDebut',
//       label: 'Date de début',
//       value: undefined,
//       type: 'date',
//       placeholder: 'Date de début'
//     },
//     {
//       id: 'dateFin',
//       label: 'Date de fin',
//       value: undefined,
//       type: 'date',
//       placeholder: 'Date de fin'
//     },
//     {
//       id: 'montantMin',
//       label: 'Montant minimum',
//       value: undefined,
//       type: 'number',
//       placeholder: 'Montant minimum'
//     },
//     {
//       id: 'montantMax',
//       label: 'Montant maximum',
//       value: undefined,
//       type: 'number',
//       placeholder: 'Montant maximum'
//     },
//     {
//       id: 'statut',
//       label: 'Statut',
//       value: undefined,
//       type: 'select',
//       placeholder: 'Filtrer par statut',
//       options: [
//         { value: 'all', label: 'Tous les statuts' },
//         { value: 'paye', label: 'Payé' },
//         { value: 'partiel', label: 'Partiellement payé' },
//         { value: 'attente', label: 'En attente' },
//         { value: 'retard', label: 'En retard' }
//       ]
//     },
//     {
//       id: 'search',
//       label: 'Recherche',
//       value: undefined,
//       type: 'text',
//       placeholder: 'Rechercher...'
//     }
//   ], [restaurants])

//   const {
//     filterState,
//     updateFilter,
//     clearFilters,
//     getActiveFiltersCount,
//     getFilterQuery,
//     exportFilters
//   } = useGlobalFilter(filterOptions)

//   // Notifier le parent des changements de filtres
//   const handleFilterChange = (filterId: string, value: any) => {
//     updateFilter(filterId, value)
//     onFiltersChange?.(filterId, value)
//   }

//   const handleClearFilters = () => {
//     clearFilters()
//     // Notifier le parent que tous les filtres sont effacés
//     onFiltersChange?.('search', '')
//     onFiltersChange?.('restaurantId', '')
//     onFiltersChange?.('dateRecouvrement', '')
//     onFiltersChange?.('montant', 0)
//   }

//   // Calculer les dates en fonction de la période sélectionnée
//   const handlePeriodeChange = (periode: string) => {
//     const today = new Date()
//     let dateDebut: Date | undefined
//     let dateFin: Date | undefined

//     switch (periode) {
//       case 'today':
//         dateDebut = today
//         dateFin = today
//         break
//       case 'week':
//         const startOfWeek = new Date(today)
//         startOfWeek.setDate(today.getDate() - today.getDay())
//         dateDebut = startOfWeek
//         dateFin = today
//         break
//       case 'month':
//         const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
//         dateDebut = startOfMonth
//         dateFin = today
//         break
//       case 'quarter':
//         const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
//         dateDebut = quarterStart
//         dateFin = today
//         break
//       case 'year':
//         const startOfYear = new Date(today.getFullYear(), 0, 1)
//         dateDebut = startOfYear
//         dateFin = today
//         break
//       case 'custom':
//         // Laisser l'utilisateur sélectionner les dates manuellement
//         break
//       default:
//         dateDebut = undefined
//         dateFin = undefined
//     }

//     updateFilter('periode', periode)
//     updateFilter('dateDebut', dateDebut)
//     updateFilter('dateFin', dateFin)
    
//     // Appliquer les filtres de date aux hooks existants
//     if (dateDebut) {
//       onFiltersChange?.('dateRecouvrement', dateDebut.toISOString().split('T')[0])
//     }
//     if (dateFin) {
//       onFiltersChange?.('dateRecouvrement', dateFin.toISOString().split('T')[0])
//     }
//   }

//   // Override du handler pour la période
//   const handleFilterChangeWithPeriode = (filterId: string, value: any) => {
//     if (filterId === 'periode') {
//       handlePeriodeChange(value)
//     } else {
//       handleFilterChange(filterId, value)
//     }
//   }

//   return (
//     <GlobalFilter
//       filters={filterOptions}
//       onFilterChange={handleFilterChangeWithPeriode}
//       onClearFilters={handleClearFilters}
//       activeFiltersCount={getActiveFiltersCount()}
//       className={className}
//     />
//   )
// }
