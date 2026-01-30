"use client"

import { ICategorieDepense } from "@/features/depenses/types/categorie-depense.type"
import { CreerDepenseModal } from "../../depense-list/creer-depense"
import FilterCategorie from "../categorie/categorie.filters"
import FilterDepenses from "./depenses.filters"

interface DepensesFiltersProps {
  filters: any
  handleFilterChange: (filterName: string, value: string) => void
  categorie_depenses: ICategorieDepense[]
  depenses: any[]
}

export function DepensesFilters({ filters, handleFilterChange, categorie_depenses, depenses }: DepensesFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterDepenses 
        onFilterChange={handleFilterChange}
        filters={filters}
      />
      <FilterCategorie 
        categorie_depenses={categorie_depenses}
        handleEnumFilterChange={handleFilterChange}
        value={filters.categorie}
      />
      <CreerDepenseModal />
    </div>
  )
}
