// "use client"

// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { 
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { 
//   Calendar, 
//   Filter, 
//   Search,
//   X,
//   ChevronDown,
//   Building
// } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { useUniversalFilter } from "@/hooks/use-universal-filter"

// // Interface pour les restaurants
// interface IRestaurant {
//   id: string;
//   nomRestaurant?: string;
//   name?: string;
// }



// export default function GlobalNavbarFilter() {
//   const [isOpen, setIsOpen] = useState(false)
//   const [searchInput, setSearchInput] = useState('')
  
//   const {
//     filterState,
//     activeFiltersCount,
//     hasActiveFilters,
//     applyFilter,
//     clearAllFilters,
//     mapPeriodToDate
//   } = useUniversalFilter()

//   const [restaurants, setRestaurants] = useState<IRestaurant[]>([])
  
//   // Récupérer les restaurants au chargement du composant
//   useEffect(() => {
//     const loadRestaurants = async () => {
//       try {
//         const data = await fetchRestaurants()
//         setRestaurants(data)
//       } catch (error) {
//         console.error('Erreur lors du chargement des restaurants:', error)
//       }
//     }
    
//     loadRestaurants()
//   }, [])

//   // Filtres dynamiques
//   const filters = [
//     {
//       id: 'periode',
//       label: 'Période',
//       icon: <Calendar className="h-4 w-4" />,
//       options: [
//         { value: 'today', label: "Aujourd'hui" },
//         { value: 'week', label: 'Cette semaine' },
//         { value: 'month', label: 'Ce mois' },
//         { value: 'quarter', label: 'Ce trimestre' },
//         { value: 'year', label: 'Cette année' }
//       ]
//     },
//     {
//       id: 'restaurant',
//       label: 'Restaurant',
//       icon: <Building className="h-4 w-4" />,
//       options: [
//         { value: 'all', label: 'Tous les restaurants' },
//         ...restaurants.map(restaurant => ({
//           value: restaurant.id,
//           label: restaurant.nomRestaurant || restaurant.name || 'Restaurant sans nom'
//         }))
//       ]
//     },
//     {
//       id: 'statut',
//       label: 'Statut',
//       icon: <Filter className="h-4 w-4" />,
//       options: [
//         { value: 'all', label: 'Tous les statuts' },
//         { value: 'paye', label: 'Payé' },
//         { value: 'partiel', label: 'Partiellement payé' },
//         { value: 'attente', label: 'En attente' },
//         { value: 'retard', label: 'En retard' }
//       ]
//     }
//   ]

//   const handleFilterChange = (filterId: string, value: string) => {
//     // Utiliser le hook universel pour appliquer le filtre
//     applyFilter(filterId, value)
//   }

//   const handleSearchChange = (value: string) => {
//     setSearchInput(value)
//     // Appliquer le filtre de recherche avec debounce
//     const timeoutId = setTimeout(() => {
//       applyFilter('search', value)
//     }, 300)
    
//     return () => clearTimeout(timeoutId)
//   }

//   const handleClearAllFilters = () => {
//     clearAllFilters()
//     setSearchInput('')
//     setIsOpen(false)
//   }

//   return (
//     <Popover open={isOpen} onOpenChange={setIsOpen}>
//       <PopoverTrigger asChild>
//         <Button
//           variant="outline"
//           className="h-9 w-[300px] justify-start text-left font-normal"
//         >
//           <div className="flex items-center gap-2 flex-1">
//             <Filter className="h-4 w-4" />
//             <span className="truncate">
//               Filtres globaux
//             </span>
//             {activeFiltersCount > 0 && (
//               <Badge variant="secondary" className="ml-auto">
//                 {activeFiltersCount}
//               </Badge>
//             )}
//           </div>
//           <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-[400px] p-0" align="start">
//         <div className="bg-card border rounded-lg shadow-lg">
//           {/* Header */}
//           <div className="flex items-center justify-between p-4 border-b">
//             <div className="flex items-center gap-2">
//               <Filter className="h-5 w-5 text-muted-foreground" />
//               <h3 className="font-semibold">Filtres globaux</h3>
//               {activeFiltersCount > 0 && (
//                 <Badge variant="secondary">
//                   {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
//                 </Badge>
//               )}
//             </div>
//             {activeFiltersCount > 0 && (
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleClearAllFilters}
//                 className="text-xs h-8"
//               >
//                 <X className="h-3 w-3 mr-1" />
//                 Effacer
//               </Button>
//             )}
//           </div>

//           {/* Filtres */}
//           <div className="p-4 space-y-4">
//             {filters.map((filter) => (
//               <div key={filter.id} className="space-y-2">
//                 <label className="text-sm font-medium flex items-center gap-2">
//                   {filter.icon}
//                   {filter.label}
//                 </label>
//                 <Select onValueChange={(value) => handleFilterChange(filter.id, value)}>
//                   <SelectTrigger>
//                     <SelectValue placeholder={`Sélectionner ${filter.label.toLowerCase()}`} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectGroup>
//                       <SelectLabel>{filter.label}</SelectLabel>
//                       {filter.options.map((option) => (
//                         <SelectItem key={option.value} value={option.value}>
//                           {option.label}
//                         </SelectItem>
//                       ))}
//                     </SelectGroup>
//                   </SelectContent>
//                 </Select>
//               </div>
//             ))}
//           </div>

//           {/* Recherche rapide */}
//           <div className="p-4 pt-0 border-t">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <input
//                 type="text"
//                 placeholder="Recherche rapide..."
//                 value={searchInput}
//                 onChange={(e) => handleSearchChange(e.target.value)}
//                 className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
//               />
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex items-center justify-between p-4 border-t bg-muted/50">
//             <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
//               Annuler
//             </Button>
//             <Button size="sm" onClick={() => setIsOpen(false)}>
//               Appliquer les filtres
//             </Button>
//           </div>
//         </div>
//       </PopoverContent>
//     </Popover>
//   )
// }
