import { format as formatDateFns } from 'date-fns';

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  endTime?: string
  type: "class" | "exam" | "meeting" | "event"
  courseId?: string
  instructorId?: string
  room?: string
  description?: string
  color?: string
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function formatDate(date: Date): string {
  return formatDateFns(date, 'yyyy-MM-dd');
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours);
  const date = new Date();
  date.setHours(hour, Number.parseInt(minutes) || 0);
  return formatDateFns(date, 'h:mm a');
}

export function parseSchedule(schedule: string): { days: string[]; startTime: string; endTime: string } {
  // Parse schedule like "Mon, Wed, Fri 09:00-10:30"
  const parts = schedule.split(" ")
  const timePart = parts[parts.length - 1]
  const daysPart = parts.slice(0, -1).join(" ")

  const days = daysPart.split(",").map((day) => day.trim())
  const [startTime, endTime] = timePart.split("-")

  return { days, startTime, endTime }
}

export function getDayOfWeek(dayName: string): number {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  let index = days.findIndex((day) => day.toLowerCase().startsWith(dayName.toLowerCase()))
  if (index === -1) {
    index = shortDays.findIndex((day) => day.toLowerCase() === dayName.toLowerCase())
  }

  return index
}

export function generateRecurringEvents(course: any, startDate: Date, endDate: Date): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const { days, startTime, endTime } = parseSchedule(course.schedule)

  const current = new Date(startDate)
  while (current <= endDate) {
    const dayName = current.toLocaleDateString("en-US", { weekday: "long" })
    const shortDayName = current.toLocaleDateString("en-US", { weekday: "short" })

    if (
      days.some(
        (day) =>
          dayName.toLowerCase().startsWith(day.toLowerCase()) || shortDayName.toLowerCase() === day.toLowerCase(),
      )
    ) {
      events.push({
        id: `${course.id}-${formatDate(current)}`,
        title: course.name,
        date: formatDate(current),
        time: startTime,
        endTime: endTime,
        type: "class",
        courseId: course.id,
        instructorId: course.instructorId,
        room: `Room ${Math.floor(Math.random() * 100) + 100}`, // Mock room assignment
        color: getEventColor("class"),
      })
    }

    current.setDate(current.getDate() + 1)
  }

  return events
}

export function getEventColor(type: string): string {
  switch (type) {
    case "class":
      return "bg-blue-500"
    case "exam":
      return "bg-red-500"
    case "meeting":
      return "bg-green-500"
    case "event":
      return "bg-purple-500"
    default:
      return "bg-gray-500"
  }
}

export function getEventsForDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events.filter((event) => event.date === date).sort((a, b) => a.time.localeCompare(b.time))
}
