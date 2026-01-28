"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarIcon, RotateCcw } from "lucide-react"

interface DateRangeFilterProps {
    onDateRangeChange: (startDate: Date | undefined, endDate: Date | undefined) => void
}

export default function DateRangeFilter({ onDateRangeChange }: DateRangeFilterProps) {
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setStartDate(value)
        const date = value ? new Date(value) : undefined
        onDateRangeChange(date, endDate ? new Date(endDate) : undefined)
    }

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setEndDate(value)
        const date = value ? new Date(value) : undefined
        onDateRangeChange(startDate ? new Date(startDate) : undefined, date)
    }

    const handleReset = () => {
        setStartDate("")
        setEndDate("")
        onDateRangeChange(undefined, undefined)
    }

    return (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Période:</span>
            </div>
            
            <div className="flex items-center gap-2">
                <Input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="w-[180px]"
                />
                <span className="text-gray-500">-</span>
                <Input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    className="w-[180px]"
                />
            </div>
            
            <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2"
            >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
            </Button>
        </div>
    )
}
