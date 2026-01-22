// RecouvrementList.tsx
"use client"


import { useState } from "react"
import { Pagination } from "./pagination"
import { Spinner } from "@heroui/spinner"
import { useRecouvrementList } from "@/feature-finance/revenus/hooks/use-recouvrement"
import { CreerRecouvrementModal } from "./creer-recouvrement-modal"
import { RecouvrementListTable } from "./recouvrement-list-table"
import RestaurantFiltre from "./filtres/restaurant-filtre"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SearchFiltre } from "./filtres/search-filter"
import { Card, CardContent, CardHeader } from "@/components/components-finance/ui/card"

export function RecouvrementList() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const { 
    recouvrement, 
    isLoading, 
    isError, 
    error, 
    filters, 
    handleFilterChange,
    resetFilters 
  } = useRecouvrementList()

  // Compter le nombre de filtres actifs
  const activeFiltersCount = Object.keys(filters).filter(key => 
    key !== 'page' && key !== 'limit' && 
    filters[key as keyof typeof filters] !== '' && 
    filters[key as keyof typeof filters] !== 0
  ).length

  // Pagination sur les données déjà filtrées par l'API
  const totalPages = Math.ceil(recouvrement.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentRecouvrements = recouvrement.slice(startIndex, startIndex + itemsPerPage)

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString("fr-FR")
    } catch {
      return dateString
    }
  }

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Spinner color="danger" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        Erreur : {String(error)}
      </div>
    )
  }

  return (
    <div className="w-full px-4 py-6 space-y-4">
      {/* En-tête avec filtres */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-xl text-blue-800">Liste des recouvrements</h2>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {activeFiltersCount} filtre(s)
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* <SearchFiltre /> */}
              <RestaurantFiltre onFilterChange={handleFilterChange} />
              {/* <DateFiltre />
              {activeFiltersCount > 0 && (
                <Button onClick={resetFilters} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )} */}
              <CreerRecouvrementModal />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tableau des recouvrements */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <RecouvrementListTable
            recouvrement={currentRecouvrements}
            formatMontant={formatMontant}
            formatDate={formatDate}
            handleFilterChange={handleFilterChange}
          />

          {/* Pagination */}
          {recouvrement.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={recouvrement.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val)
                setCurrentPage(1)
              }}
            />
          )}

          {/* Message vide */}
          {recouvrement.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">Aucun recouvrement trouvé</p>
              {activeFiltersCount > 0 ? (
                <p className="text-sm">
                  Essayez de modifier vos critères de recherche ou{' '}
                  <Button 
                    variant="link" 
                    onClick={resetFilters}
                    className="p-0 h-auto"
                  >
                    réinitialiser les filtres
                  </Button>
                </p>
              ) : (
                <p className="text-sm">
                  Aucune donnée disponible pour le moment
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}