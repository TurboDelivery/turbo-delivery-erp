"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useMemo } from "react"
import { IDepense } from "@/feature-finance/depenses/types/depense.type"
import { ICategorieDepense } from "@/feature-finance/depenses/types/categorie-depense.type"
import { DepensesFilters } from "../filtres/depenses"
import { DepensesTable } from "./depenses-table"
import { Pagination } from "./pagination"


interface IDepenseListProps {
  depenses: IDepense[];
  categorie_depenses: ICategorieDepense[];
}

export function DepenseList({ depenses, categorie_depenses }: IDepenseListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filters, setFilters] = useState({
    categorie: '',
    description: '',
    montant: '',
    dateDepense: ''
  })

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }))
    setCurrentPage(1)
  }

  const filteredDepenses = useMemo(() => {
    return depenses.filter(depense => {
      if (filters.categorie && depense.categorie.id !== filters.categorie) return false
      if (filters.description && !depense.libelle.toLowerCase().includes(filters.description.toLowerCase())) return false
      if (filters.montant) {
        const montantValue = parseFloat(filters.montant)
        if (isNaN(montantValue) || depense.montant !== montantValue) return false
      }
      if (filters.dateDepense) {
        const depenseDate = new Date(depense.dateDepense).toISOString().split('T')[0]
        if (depenseDate !== filters.dateDepense) return false
      }
      return true
    })
  }, [depenses, filters])

  const totalPages = Math.ceil(filteredDepenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentDepenses = filteredDepenses.slice(startIndex, startIndex + itemsPerPage)

  const getCategoriesStyle = (categorieName: string) => {
    const colors = ["bg-red-500 text-white","bg-green-500 text-white","bg-blue-500 text-white","bg-yellow-500 text-white","bg-pink-500 text-white","bg-purple-500 text-white"]
    const hash = categorieName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      return new Date(dateString).toLocaleDateString('fr-FR')
    } catch {
      return dateString
    }
  }

  const formatMontant = (montant: number) => new Intl.NumberFormat('fr-FR').format(montant)

  return (
    <div className="w-full px-4 py-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-blue-50">
          <CardTitle>
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <h2 className="font-bold text-xl text-blue-800">Liste des dépenses</h2>
              <DepensesFilters 
                filters={filters}
                handleFilterChange={handleFilterChange}
                categorie_depenses={categorie_depenses}
                depenses={depenses}
              />
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <DepensesTable 
            depenses={currentDepenses}
            getCategoriesStyle={getCategoriesStyle}
            formatDate={formatDate}
            formatMontant={formatMontant}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredDepenses.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1) }}
          />

          {filteredDepenses.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>Aucune dépense trouvée</p>
              {Object.values(filters).some(f => f) && <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
