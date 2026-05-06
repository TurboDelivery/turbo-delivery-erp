"use client"

import { useState } from "react"
import { RestaurantFilter } from "../restaurant/restaurant-filter"
import FilterPeriode from "../periode/filter-periode"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface RevenusFiltersProps {
    onRestaurantChange: (restaurantIds: string[]) => void
    selectedRestaurants: string[]
    onClearFilters: () => void
}

export function RevenusFilters({ 
    onRestaurantChange, 
    selectedRestaurants,
    onClearFilters 
}: RevenusFiltersProps) {
    const hasActiveFilters = selectedRestaurants.length > 0

    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-3">
                <RestaurantFilter
                    onRestaurantChange={onRestaurantChange}
                    selectedRestaurants={selectedRestaurants}
                />
                
                <FilterPeriode moduleName="livraison" />
            </div>

            {/* Bouton d'effacement */}
            {hasActiveFilters && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearFilters}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                    <X className="h-4 w-4" />
                    Effacer les filtres
                </Button>
            )}
        </div>
    )
}
