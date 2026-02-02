"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface MonthFilterProps {
    selectedMonth: number | null
    onMonthChange: (month: number | null) => void
    isLoading?: boolean
}

const months = [
    { value: 1, label: "Janvier" },
    { value: 2, label: "Février" },
    { value: 3, label: "Mars" },
    { value: 4, label: "Avril" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juin" },
    { value: 7, label: "Juillet" },
    { value: 8, label: "Août" },
    { value: 9, label: "Septembre" },
    { value: 10, label: "Octobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Décembre" },
]

export function MonthFilter({ selectedMonth, onMonthChange, isLoading = false }: MonthFilterProps) {
    return (
        <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1">
                <Button
                    variant={selectedMonth === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => onMonthChange(null)}
                    disabled={isLoading}
                    className="text-xs px-2 py-1"
                >
                    Tous
                </Button>
                {months.map((month) => (
                    <Button
                        key={month.value}
                        variant={selectedMonth === month.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onMonthChange(month.value)}
                        disabled={isLoading}
                        className="text-xs px-2 py-1"
                    >
                        {month.label.slice(0, 3)}
                    </Button>
                ))}
            </div>
        </div>
    )
}
