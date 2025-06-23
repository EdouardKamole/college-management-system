"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
  formatTime,
  getEventsForDate,
  type CalendarEvent,
} from "@/lib/calendar-utils"

interface CalendarProps {
  events: CalendarEvent[]
  onDateClick?: (date: string) => void
  onEventClick?: (event: CalendarEvent) => void
  onAddEvent?: (date: string) => void
  selectedDate?: string
  className?: string
}

export function Calendar({ events, onDateClick, onEventClick, onAddEvent, selectedDate, className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const calendarDays = useMemo(() => {
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = formatDate(date)
      const dayEvents = getEventsForDate(events, dateString)

      days.push({
        day,
        date: dateString,
        events: dayEvents,
        isToday: dateString === formatDate(new Date()),
        isSelected: dateString === selectedDate,
      })
    }

    return days
  }, [year, month, daysInMonth, firstDayOfMonth, events, selectedDate])

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-1 border border-gray-200 dark:border-gray-700 rounded-md",
                day ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : "",
                day?.isToday ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "",
                day?.isSelected ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700" : "",
              )}
              onClick={() => day && onDateClick?.(day.date)}
            >
              {day && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-sm font-medium", day.isToday ? "text-blue-600 dark:text-blue-400" : "")}>
                      {day.day}
                    </span>
                    {onAddEvent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddEvent(day.date)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded text-white cursor-pointer truncate",
                          event.color || "bg-blue-500",
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                        title={`${event.title} - ${formatTime(event.time)}`}
                      >
                        {formatTime(event.time)} {event.title}
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="text-xs text-muted-foreground">+{day.events.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
