"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { parseDate } from "chrono-node"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function formatDate(date: Date | undefined) {
  if (!date) return ""
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

type CalendarInputProps = {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function CalendarInput({ value, onChange, placeholder, className }: CalendarInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value ? formatDate(value) : "")
  const [month, setMonth] = React.useState<Date | undefined>(value)

  // Synchroniser l'input avec la valeur externe
  React.useEffect(() => {
    setInputValue(value ? formatDate(value) : "")
    setMonth(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    const parsed = parseDate(newValue)
    if (parsed) {
      onChange?.(parsed)
      setMonth(parsed)
    }
  }

  const handleSelectDate = (date: Date | undefined) => {
    onChange?.(date)
    setInputValue(date ? formatDate(date) : "")
    setOpen(false)
  }

  return (
    <div className={cn("relative flex gap-2", className)}>
      <Input
        value={inputValue}
        placeholder={placeholder || "Sélectionnez une date"}
        className="bg-background pr-10"
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Sélectionnez une date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            month={month}
            onMonthChange={setMonth}
            onSelect={handleSelectDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}