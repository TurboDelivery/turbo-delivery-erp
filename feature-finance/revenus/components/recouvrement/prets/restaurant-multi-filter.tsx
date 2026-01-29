"use client"

import { useMemo } from "react"
import { usePretList } from "@/feature-finance/revenus/hooks/use-pret-list"
import Select, { components } from "react-select"
import { Store } from "lucide-react"

// Composant personnalisé pour les options avec icône
const OptionWithIcon = (props: any) => {
    return (
        <components.Option {...props}>
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                    <Store className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex-1">
                    <div className="font-medium text-gray-900">{props.data.label}</div>
                    <div className="text-xs text-gray-500">Restaurant</div>
                </div>
            </div>
        </components.Option>
    )
}

// Composant personnalisé pour les tags multi-sélection
const MultiValueLabel = (props: any) => {
    return (
        <components.MultiValueLabel {...props}>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{props.data.label}</span>
            </div>
        </components.MultiValueLabel>
    )
}

interface RestaurantMultiFilterProps {
    onRestaurantChange: (restaurantIds: string[]) => void
    selectedRestaurants: string[]
}

export function RestaurantMultiFilter({ onRestaurantChange, selectedRestaurants }: RestaurantMultiFilterProps) {
    const { allFactures } = usePretList()
    
    // Extraire les noms de restaurants uniques depuis les factures
    const restaurantOptions = useMemo(() => {
        if (!Array.isArray(allFactures) || allFactures.length === 0) return []
        
        const uniqueRestaurants = new Set<string>()
        allFactures.forEach(facture => {
            if (facture.nomRestaurant) {
                uniqueRestaurants.add(facture.nomRestaurant)
            }
        })
        
        return Array.from(uniqueRestaurants).map(restaurant => ({
            value: restaurant,
            label: restaurant
        })).sort((a, b) => a.label.localeCompare(b.label))
    }, [allFactures])
    
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
        <div className="relative w-full md:w-[350px]">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
            <Select
                isMulti
                placeholder="Filtrer par restaurants..."
                options={restaurantOptions}
                value={selectedOptions}
                onChange={handleChange}
                components={{
                    Option: OptionWithIcon,
                    MultiValueLabel: MultiValueLabel,
                }}
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
                        minHeight: '42px',
                        fontSize: '0.875rem',
                        backgroundColor: 'white',
                    }),
                    placeholder: (baseStyles) => ({
                        ...baseStyles,
                        color: '#9ca3af',
                        fontSize: '0.875rem',
                    }),
                    multiValue: (baseStyles) => ({
                        ...baseStyles,
                        backgroundColor: '#dbeafe',
                        borderRadius: '0.5rem',
                        border: '1px solid #bfdbfe',
                        margin: '4px 4px 4px 0',
                    }),
                    multiValueLabel: (baseStyles) => ({
                        ...baseStyles,
                        color: '#1e40af',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        padding: '4px 8px',
                    }),
                    multiValueRemove: (baseStyles) => ({
                        ...baseStyles,
                        color: '#1e40af',
                        borderRadius: '0 0.5rem 0.5rem 0',
                        padding: '4px',
                        '&:hover': {
                            backgroundColor: '#bfdbfe',
                            color: '#1e40af',
                        },
                    }),
                    menu: (baseStyles) => ({
                        ...baseStyles,
                        zIndex: 50,
                        border: '1px solid #d1d5db',
                        borderRadius: '0.75rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        marginTop: '4px',
                    }),
                    menuList: (baseStyles) => ({
                        ...baseStyles,
                        padding: '8px',
                        borderRadius: '0.75rem',
                    }),
                    option: (baseStyles, state) => ({
                        ...baseStyles,
                        backgroundColor: state.isFocused ? '#f8fafc' : 'white',
                        color: state.isFocused ? '#1f2937' : '#374151',
                        padding: '12px',
                        margin: '2px',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        border: state.isFocused ? '1px solid #e2e8f0' : '1px solid transparent',
                        '&:hover': {
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                        },
                        '&:active': {
                            backgroundColor: '#f1f5f9',
                        },
                    }),
                    noOptionsMessage: (baseStyles) => ({
                        ...baseStyles,
                        padding: '16px',
                        color: '#9ca3af',
                        fontSize: '0.875rem',
                        textAlign: 'center',
                    }),
                    dropdownIndicator: (baseStyles) => ({
                        ...baseStyles,
                        color: '#6b7280',
                        padding: '8px',
                        '&:hover': {
                            color: '#4b5563',
                        },
                    }),
                    indicatorSeparator: (baseStyles) => ({
                        ...baseStyles,
                        backgroundColor: '#e5e7eb',
                        margin: '0 8px',
                    }),
                }}
                noOptionsMessage={() => "Aucun restaurant trouvé"}
            />
        </div>
    )
}
