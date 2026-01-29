"use client"

import { useState, useMemo } from "react"
import { useLivraisonList } from "@/feature-finance/revenus/hooks/use-livraison-list"
import Select from "react-select"
import { Store } from "lucide-react"

interface RestaurantFilterProps {
    onRestaurantChange: (restaurantIds: string[]) => void
    selectedRestaurants: string[]
}

export function RestaurantFilter({ onRestaurantChange, selectedRestaurants }: RestaurantFilterProps) {
    const { livraisons } = useLivraisonList()
    
    // Extraire les noms de restaurants uniques depuis les livraisons
    const restaurantOptions = useMemo(() => {
        if (!Array.isArray(livraisons)) return []
        
        const uniqueRestaurants = new Set<string>()
        livraisons.forEach(livraison => {
            if (livraison.nomRestaurant) {
                uniqueRestaurants.add(livraison.nomRestaurant)
            }
        })
        
        return Array.from(uniqueRestaurants).map(restaurant => ({
            value: restaurant,
            label: restaurant
        })).sort((a, b) => a.label.localeCompare(b.label))
    }, [livraisons])
    
    // Convertir les restaurants sélectionnés en options pour react-select
    const selectedOptions = useMemo(() => {
        return restaurantOptions.filter(option => selectedRestaurants.includes(option.value))
    }, [restaurantOptions, selectedRestaurants])
    
    // Gérer le changement de sélection
    const handleChange = (selectedOptions: any) => {
        const selectedIds = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : []
        onRestaurantChange(selectedIds)
    }

    return (
        <div className="relative w-full md:w-[300px]">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
            <Select
                isMulti
                placeholder="Filtrer par restaurants..."
                options={restaurantOptions}
                value={selectedOptions}
                onChange={handleChange}
                className="restaurant-multi-select"
                classNamePrefix="react-select"
                styles={{
                    control: (baseStyles, state) => ({
                        ...baseStyles,
                        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                        boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                        '&:hover': {
                            borderColor: '#3b82f6',
                        },
                        paddingLeft: '2.5rem', // Space for icon
                        minHeight: '38px',
                        fontSize: '0.875rem',
                    }),
                    placeholder: (baseStyles) => ({
                        ...baseStyles,
                        color: '#9ca3af',
                    }),
                    multiValue: (baseStyles) => ({
                        ...baseStyles,
                        backgroundColor: '#dbeafe',
                        borderRadius: '0.375rem',
                    }),
                    multiValueLabel: (baseStyles) => ({
                        ...baseStyles,
                        color: '#1e40af',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                    }),
                    multiValueRemove: (baseStyles) => ({
                        ...baseStyles,
                        color: '#1e40af',
                        '&:hover': {
                            backgroundColor: '#bfdbfe',
                            color: '#1e40af',
                        },
                    }),
                    menu: (baseStyles) => ({
                        ...baseStyles,
                        zIndex: 50,
                    }),
                }}
                noOptionsMessage={() => "Aucun restaurant trouvé"}
            />
        </div>
    )
}
