// "use client"

// import { useState } from "react"
// import { 
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { Button } from "@/components/ui/button"
// import { CalendarInput } from "@/components/block/dateInput"
// import { 
//   Calendar, 
//   Filter, 
//   Search, 
//   X,
//   Building,
//   DollarSign,
//   Clock
// } from "lucide-react"
// import { Badge } from "@/components/ui/badge"

// export interface FilterOption {
//   id: string
//   label: string
//   value: string | number | Date | undefined
//   type: 'select' | 'date' | 'text' | 'number'
//   placeholder?: string
//   options?: Array<{ value: string; label: string }>
// }

// export interface GlobalFilterProps {
//   filters: FilterOption[]
//   onFilterChange: (filterId: string, value: any) => void
//   onClearFilters: () => void
//   activeFiltersCount?: number
//   className?: string
// }

// export default function GlobalFilter({
//   filters,
//   onFilterChange,
//   onClearFilters,
//   activeFiltersCount = 0,
//   className = ""
// }: GlobalFilterProps) {
//   const [isExpanded, setIsExpanded] = useState(false)

//   const getActiveFilters = () => {
//     return filters.filter(filter => filter.value !== undefined && filter.value !== '' && filter.value !== 0)
//   }

//   const renderFilterInput = (filter: FilterOption) => {
//     switch (filter.type) {
//       case 'select':
//         return (
//           <Select
//             value={filter.value?.toString() || ""}
//             onValueChange={(value) => onFilterChange(filter.id, value)}
//           >
//             <SelectTrigger className="w-full">
//               <SelectValue placeholder={filter.placeholder || `Sélectionner ${filter.label}`} />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectGroup>
//                 <SelectLabel>{filter.label}</SelectLabel>
//                 {filter.options?.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </SelectGroup>
//             </SelectContent>
//           </Select>
//         )

//       case 'date':
//         return (
//           <CalendarInput
//             value={filter.value as Date | undefined}
//             onChange={(date) => onFilterChange(filter.id, date)}
//             placeholder={filter.placeholder || `Sélectionner ${filter.label}`}
//             className="w-full"
//           />
//         )

//       case 'text':
//         return (
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <input
//               type="text"
//               placeholder={filter.placeholder || `Rechercher ${filter.label}`}
//               value={filter.value?.toString() || ""}
//               onChange={(e) => onFilterChange(filter.id, e.target.value)}
//               className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
//             />
//           </div>
//         )

//       case 'number':
//         return (
//           <div className="relative">
//             <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <input
//               type="number"
//               placeholder={filter.placeholder || `Entrez ${filter.label}`}
//               value={filter.value?.toString() || ""}
//               onChange={(e) => onFilterChange(filter.id, e.target.value ? Number(e.target.value) : undefined)}
//               className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
//             />
//           </div>
//         )

//       default:
//         return null
//     }
//   }

//   const getFilterIcon = (type: string) => {
//     switch (type) {
//       case 'date':
//         return <Calendar className="h-4 w-4" />
//       case 'select':
//         return <Building className="h-4 w-4" />
//       case 'text':
//         return <Search className="h-4 w-4" />
//       case 'number':
//         return <DollarSign className="h-4 w-4" />
//       default:
//         return <Filter className="h-4 w-4" />
//     }
//   }

//   return (
//     <div className={`w-full ${className}`}>
//       {/* Header du filtre */}
//       <div className="flex items-center justify-between p-4 border-b bg-card">
//         <div className="flex items-center gap-2">
//           <Filter className="h-5 w-5 text-muted-foreground" />
//           <h3 className="font-semibold">Filtres globaux</h3>
//           {activeFiltersCount > 0 && (
//             <Badge variant="secondary" className="ml-2">
//               {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
//             </Badge>
//           )}
//         </div>
//         <div className="flex items-center gap-2">
//           {activeFiltersCount > 0 && (
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={onClearFilters}
//               className="text-xs"
//             >
//               <X className="h-3 w-3 mr-1" />
//               Effacer tout
//             </Button>
//           )}
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => setIsExpanded(!isExpanded)}
//           >
//             {isExpanded ? "Réduire" : "Voir plus"}
//           </Button>
//         </div>
//       </div>

//       {/* Filtres principaux (toujours visibles) */}
//       <div className="p-4 space-y-4">
//         {filters.slice(0, 2).map((filter) => (
//           <div key={filter.id} className="space-y-2">
//             <label className="text-sm font-medium flex items-center gap-2">
//               {getFilterIcon(filter.type)}
//               {filter.label}
//             </label>
//             {renderFilterInput(filter)}
//           </div>
//         ))}
//       </div>

//       {/* Filtres additionnels (dépliables) */}
//       {isExpanded && filters.length > 2 && (
//         <div className="p-4 pt-0 space-y-4 border-t">
//           {filters.slice(2).map((filter) => (
//             <div key={filter.id} className="space-y-2">
//               <label className="text-sm font-medium flex items-center gap-2">
//                 {getFilterIcon(filter.type)}
//                 {filter.label}
//               </label>
//               {renderFilterInput(filter)}
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Filtres actifs */}
//       {getActiveFilters().length > 0 && (
//         <div className="p-4 border-t bg-muted/50">
//           <div className="flex flex-wrap gap-2">
//             {getActiveFilters().map((filter) => (
//               <Badge
//                 key={filter.id}
//                 variant="outline"
//                 className="text-xs flex items-center gap-1"
//               >
//                 {filter.label}: {filter.value?.toString()}
//                 <button
//                   onClick={() => onFilterChange(filter.id, undefined)}
//                   className="ml-1 hover:text-destructive"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </Badge>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }
