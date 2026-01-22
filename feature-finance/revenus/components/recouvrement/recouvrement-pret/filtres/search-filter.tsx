// components/filtres/search-filtre.tsx
"use client"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRecouvrementList } from "@/feature-finance/revenus/hooks/use-recouvrement"
import { useState, useEffect } from "react"

export function SearchFiltre() {
  const { filters, handleFilterChange, resetFilter } = useRecouvrementList()
  const [searchValue, setSearchValue] = useState(filters.search)

  // Synchroniser avec les filtres
  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  const handleSearch = () => {
    handleFilterChange('search', searchValue)
  }

  const handleClear = () => {
    setSearchValue('')
    resetFilter('search')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Rechercher..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-4"
        />
      </div>
      <Button onClick={handleSearch} variant="default">
        Rechercher
      </Button>
      {filters.search && (
        <Button onClick={handleClear} variant="outline">
          Effacer
        </Button>
      )}
    </div>
  )
}