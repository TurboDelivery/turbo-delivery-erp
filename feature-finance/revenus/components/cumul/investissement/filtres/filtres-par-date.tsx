"use client"
import { CalendarInput } from "@/components/components-finance/block/dateInput"
import { useState, useEffect } from "react"
import { useInvestissementList } from "@/feature-finance/revenus/hooks/use-investissement-list"

interface InvestissementDateFilterProps {
    onFilterChange?: (filterName: string, value: string) => void;
}

export default function InvestissementDateFilter({ onFilterChange }: InvestissementDateFilterProps) {
    const [selectedDateInvestissement, setSelectedDateInvestissement] = useState<Date | undefined>(undefined)
    
    const { filters, handleFilterChange } = useInvestissementList()
    
    // Synchroniser l'état sélectionné avec les filtres actuels
    useEffect(() => {
        if (filters.dateInvestissement) {
            setSelectedDateInvestissement(new Date(filters.dateInvestissement))
        } else {
            setSelectedDateInvestissement(undefined)
        }
    }, [filters.dateInvestissement])

    // Gérer le changement de date d'investissement
    const handleDateInvestissementChange = (date: Date | undefined) => {
        setSelectedDateInvestissement(date)
        
        const dateStr = date ? date.toISOString().split('T')[0] : ''
        
        // Utiliser le callback direct si fourni (pour l'approche locale)
        if (onFilterChange) {
            onFilterChange('dateInvestissement', dateStr)
        }
        
        // Appliquer le filtre via le hook useInvestissementList
        handleFilterChange('dateInvestissement', dateStr)
    }

    return (
        <div className="w-full">
            <CalendarInput
                value={selectedDateInvestissement}
                onChange={handleDateInvestissementChange}
                placeholder="Date d'investissement"
                className="w-full"
            />
        </div>
    )
}