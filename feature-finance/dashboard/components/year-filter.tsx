"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface YearFilterProps {
    selectedYear: number
    onYearChange: (year: number) => void
    isLoading?: boolean
}

export function YearFilter({ selectedYear, onYearChange, isLoading = false }: YearFilterProps) {
    // Générer les années disponibles (depuis 2020 jusqu'à l'année prochaine)
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: currentYear - 2019 + 2 }, (_, i) => 2020 + i)

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Année:</span>
            </div>
            
            <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => onYearChange(parseInt(value))}
                disabled={isLoading}
            >
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Années disponibles</SelectLabel>
                        {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>

            {isLoading && (
                <div className="text-sm text-muted-foreground">
                    Chargement...
                </div>
            )}
        </div>
    )
}
