"use client"

import { useState } from "react"
import { useUniversalFilter } from "@/hooks/use-universal-filter"
import { CalendarInput } from "@/components/components-finance/block/dateInput"

interface CommissionDateFilterProps {
    onFilterChange?: (filterName: string, value: string) => void;
}

export default function CommissionDateFilter({ onFilterChange }: CommissionDateFilterProps) {
    const [selectedDateCommission, setSelectedDateCommission] = useState<Date | undefined>(undefined)
    
    const { applyFilter } = useUniversalFilter()

    // Gérer le changement de date de commission
    const handleDateCommissionChange = (date: Date | undefined) => {
        setSelectedDateCommission(date)
        
        const dateStr = date ? date.toISOString().split('T')[0] : ''
        
        // Utiliser le callback direct si fourni (pour l'approche locale)
        if (onFilterChange) {
            onFilterChange('createdAt', dateStr)
        }
        
        // Appliquer le filtre universel (pour l'approche globale)
        applyFilter('createdAt', dateStr)
    }


    return (
        <div className="w-full">
            <CalendarInput
                value={selectedDateCommission}
                onChange={handleDateCommissionChange}
                placeholder="Date de commission"
                className="w-full"
            />
        </div>
    )
}