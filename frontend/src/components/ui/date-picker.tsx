"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecionar data",
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate)
    setOpen(false)
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground"
        )}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>{placeholder}</span>}
      </Button>
      
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-80 min-w-80 rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {/* Header */}
            <div className="col-span-7 flex items-center justify-between mb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newDate = new Date(date || new Date())
                  newDate.setMonth(newDate.getMonth() - 1)
                  onDateChange?.(newDate)
                }}
              >
                ←
              </Button>
              <span className="font-medium">
                {date ? format(date, "MMMM yyyy", { locale: ptBR }) : format(new Date(), "MMMM yyyy", { locale: ptBR })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newDate = new Date(date || new Date())
                  newDate.setMonth(newDate.getMonth() + 1)
                  onDateChange?.(newDate)
                }}
              >
                →
              </Button>
            </div>
            
            {/* Days of week */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-muted-foreground font-medium">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {Array.from({ length: 35 }, (_, i) => {
              const currentDate = new Date()
              const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
              const startDate = new Date(firstDay)
              startDate.setDate(startDate.getDate() - firstDay.getDay())
              startDate.setDate(startDate.getDate() + i)
              
              const isCurrentMonth = startDate.getMonth() === currentDate.getMonth()
              const isSelected = date && startDate.toDateString() === date.toDateString()
              const isToday = startDate.toDateString() === new Date().toDateString()
              const isDisabled = isDateDisabled(startDate)
              
              return (
                <Button
                  type="button"
                  key={i}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    !isCurrentMonth && "text-muted-foreground",
                    isSelected && "bg-primary text-primary-foreground",
                    isToday && !isSelected && "bg-accent",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isDisabled}
                  onClick={() => isCurrentMonth && !isDisabled && handleDateSelect(startDate)}
                >
                  {startDate.getDate()}
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}