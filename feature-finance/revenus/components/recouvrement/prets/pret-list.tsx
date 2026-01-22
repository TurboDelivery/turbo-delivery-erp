"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useMemo } from "react"
import { PretTable } from "./pret-list-table"
import { Pagination } from "./pagination"
import { usePretList } from "@/feature-finance/revenus/hooks/use-pret-list"
import { Spinner } from "@heroui/spinner"
import RestaurantFiltre from "./restaurant-filtre"

export function PretList() {
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [filters, setFilters] = useState({
        id: "",
        nomRestaurant: "",
        totalFraisLivraisons: "",
        totalCommission: "",
        totalFacture: "",
    })

    //  On récupère les prêts depuis le hook
    const { facture, isLoading, isError, error } = usePretList()

    const handleFilterChange = (filterName: string, value: string) => {
        setFilters((prev) => ({ ...prev, [filterName]: value }))
        setCurrentPage(1)
    }

    //  Filtrage
    const filteredPrets = useMemo(() => {
        return facture.filter((factureItem) => {
            if (filters.id && factureItem.id !== filters.id) return false
            if (filters.nomRestaurant && factureItem.nomRestaurant !== filters.nomRestaurant) return false
            if (filters.totalFraisLivraisons) {
                const totalFraisLivraisonsValue = parseFloat(filters.totalFraisLivraisons)
                if (isNaN(totalFraisLivraisonsValue) || factureItem.totalFraisLivraisons !== totalFraisLivraisonsValue) return false
            }
            return true
        })
    }, [facture, filters])

    const totalPages = Math.ceil(filteredPrets.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentPrets = filteredPrets.slice(startIndex, startIndex + itemsPerPage)

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
        return <Spinner color="danger" />
    }

    if (isError) {
        return (
            <div className="p-8 text-center text-red-500">
                Erreur : {String(error)}
            </div>
        )
    }

    return (
        <div className="w-full px-4 py-6">
            <Card className="shadow-lg border-0">
                <CardHeader className="bg-blue-50">
                    <CardTitle>
                        <div className="flex justify-between items-center gap-4 py-2">
                            <h2 className="font-bold text-xl text-blue-800">Liste des factures a recouvrir</h2>
                            <RestaurantFiltre onFilterChange={handleFilterChange}/>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    <PretTable
                        facture={currentPrets}
                        formatDate={formatDate}
                        formatMontant={formatMontant}
                    />

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredPrets.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(val) => {
                            setItemsPerPage(val)
                            setCurrentPage(1)
                        }}
                    />

                    {filteredPrets.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>Aucun prêt trouvé</p>
                            {Object.values(filters).some((f) => f) && (
                                <p className="text-sm mt-2">
                                    Essayez de modifier vos critères de recherche
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
