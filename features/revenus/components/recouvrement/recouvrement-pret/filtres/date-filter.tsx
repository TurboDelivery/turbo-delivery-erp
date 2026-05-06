// // components/filtres/date-filtre.tsx
// "use client"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { useRecouvrementList } from "@/feature/revenus/hooks/use-recouvrement"
// import { Calendar } from "lucide-react"
// import { CalendarInput } from "@/components/block/dateInput"

// export function DateFiltre() {
//   const { filters, handleFilterChange, resetFilter } = useRecouvrementList()

//   const handleDateChange = (value: Date | undefined) => {
//     handleFilterChange('dateRecouvrement', value ? value.toISOString().split('T')[0] : '')
//   }

//   const clearDate = () => {
//     resetFilter('dateRecouvrement')
//   }

//   return (
//     <div className="flex items-center gap-2">
//       <div className="flex items-center gap-2">
//         <CalendarInput
//             value={filters.dateRecouvrement ? new Date(filters.dateRecouvrement) : undefined}
//             onChange={(e) => handleDateChange(e)}
//             className="w-40"
//         />
//       </div>
//       {filters.dateRecouvrement && (
//         <Button onClick={clearDate} variant="outline" size="sm">
//           ×
//         </Button>
//       )}
//     </div>
//   )
// }