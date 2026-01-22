"use client"

import { CalendarInput } from "@/components/components-finance/block/dateInput"
import { Input } from "@/components/ui/input"
import { Search, Calendar } from "lucide-react"
import { useCallback } from "react"

interface FilterDepensesProps {
  onFilterChange?: (filterName: string, value: string) => void;
  filters?: {
    description: string;
    montant: string;
    dateDepense: string;
  };
}

export default function FilterDepenses({ onFilterChange, filters = { description: '', montant: '', dateDepense: '' } }: FilterDepensesProps) {
  // Gestionnaire pour le filtre de description
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange?.('description', e.target.value)
  }, [onFilterChange])

  // Gestionnaire pour le filtre de montant
  const handleMontantChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange?.('montant', e.target.value)
  }, [onFilterChange])

  // Gestionnaire pour le filtre de date
  const handleDateChange = useCallback((date: Date | undefined) => {
    const dateString = date ? date.toISOString().split('T')[0] : ''
    onFilterChange?.('dateDepense', dateString)
  }, [onFilterChange])

  // Gestionnaire pour le fitre de categorie
  const handleCategorieChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange?.('categorie', e.target.value)
  }, [onFilterChange])

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
      {/* Recherche par description */}
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="description"
          type="text"
          placeholder="Description"
          value={filters.description || ''}
          onChange={handleDescriptionChange}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* Recherche par montant */}
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="montant"
          type="number"
          placeholder="Montant"
          value={filters.montant || ''}
          onChange={handleMontantChange}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* Recherche par date */}
      <div className="relative w-full sm:w-auto">
        <CalendarInput
          value={filters.dateDepense ? new Date(filters.dateDepense) : undefined}
          onChange={handleDateChange}
          placeholder="Date de dépense"
          className="w-full pl-10 text-sm"
        />
      </div>

      {/* Recherche par categorie */}
     


      {/* Bouton pour effacer les filtres */}
      <button
        onClick={() => {
          onFilterChange?.('description', '')
          onFilterChange?.('montant', '')
          onFilterChange?.('dateDepense', '')
        }}
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-colors"
      >
        Effacer
      </button>
    </div>
  )
}