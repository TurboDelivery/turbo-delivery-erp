"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useMemo } from "react"
import { PretTable } from "./pret-list-table"
import { Pagination } from "./pagination"
import { usePretList } from "@/features/revenus/hooks/use-pret-list"
import { Spinner } from "@/components/ui/spinner"
import { RestaurantMultiFilter } from "./restaurant-multi-filter"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function PretList() {
    const { 
        facture, 
        isLoading, 
        isError, 
        error, 
        filters, 
        handleFilterChange,
        resetFilters 
    } = usePretList()

    // Utiliser les filtres de l'URL (nuqs) pour la pagination
    const currentPage = filters.page
    const itemsPerPage = filters.limit
    const selectedRestaurants = filters.selectedRestaurants || []

    // Gestionnaire pour le changement de restaurants (multi-sélection)
    const handleRestaurantChange = (restaurantIds: string[]) => {
        handleFilterChange('selectedRestaurants', restaurantIds)
    }

    // Gestionnaire pour effacer tous les filtres
    const handleClearFilters = () => {
        resetFilters()
    }

    //  Filtrage (déjà géré par le hook usePretList avec nuqs)
    const filteredPrets = facture

    // Pagination sur les données déjà filtrées
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

    if (isLoading) {
        return <Spinner size="large" />
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
                <CardHeader className="bg-blue-100">
                    <CardTitle>
                        <div className="flex justify-between items-center gap-4 py-2">
                            <h2 className="font-bold text-xl text-blue-800">Liste des factures a recouvrir</h2>
                            <div className="flex items-center gap-3">
                                <RestaurantMultiFilter
                                    onRestaurantChange={handleRestaurantChange}
                                    selectedRestaurants={selectedRestaurants}
                                />
                                {selectedRestaurants.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                                    >
                                        <X className="h-4 w-4" />
                                        Effacer
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    <PretTable
                        facture={currentPrets}
                        formatDate={formatDate}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredPrets.length}
                    />

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredPrets.length}
                        onPageChange={(page) => handleFilterChange('page', page)}
                        onItemsPerPageChange={(limit) => {
                            handleFilterChange('limit', limit)
                            handleFilterChange('page', 1)
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
