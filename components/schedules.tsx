"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/calendar"
import { Plus, Clock, MapPin, User, BookOpen, Edit, Trash2, CalendarIcon } from "lucide-react"
import {
  generateRecurringEvents,
  formatTime,
  formatDate,
  getEventsForDate,
  getEventColor,
  type CalendarEvent,
} from "@/lib/calendar-utils"
import type { Schedule } from "@/lib/data"
import { v4 as uuidv4 } from "uuid"
import React from "react"

export function Schedules() {
  const { user } = useAuth()
  const { data, loading, error, refetch } = useSupabaseData()
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()))
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [activeTab, setActiveTab] = useState("calendar")

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    endTime: "",
    type: "class" as "class" | "exam" | "meeting" | "event",
    courseId: "",
    room: "",
    description: "",
  })

  const canManageSchedules = user?.role === "admin"
  const courses = data.courses
  let userCourses = courses
  if (user?.role === "instructor") {
    userCourses = courses.filter((c: any) => c.instructorId === user.id)
  } else if (user?.role === "student") {
    userCourses = courses.filter((c: any) => c.studentIds?.includes(user.id))
  }

  // Generate calendar events from courses and schedules
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = []

    // Generate recurring class events from courses
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 3)

    userCourses.forEach((course) => {
      const courseEvents = generateRecurringEvents(course, startDate, endDate)
      events.push(...courseEvents)
    })

    // Add exam events
    data.exams.forEach((exam) => {
      const course = data.courses.find((c) => c.id === exam.courseid)
      if (
        course &&
        (user?.role === "admin" ||
          (user?.role === "instructor" && course.instructorid === user.id) ||
          (user?.role === "student" && course.studentids.includes(user.id)))
      ) {
        events.push({
          id: `exam-${exam.id}`,
          title: `${exam.name} (${course.name})`,
          date: exam.date,
          time: "09:00",
          endTime: "11:00",
          type: "exam",
          courseId: exam.courseid,
          description: `Duration: ${exam.duration} minutes`,
          color: getEventColor("exam"),
        })
      }
    })

    // Add custom schedule events
    data.schedules.forEach((schedule) => {
      const course = data.courses.find((c) => c.id === schedule.courseid)
      if (
        course &&
        (user?.role === "admin" ||
          (user?.role === "instructor" && course.instructorid === user.id) ||
          (user?.role === "student" && course.studentids.includes(user.id)))
      ) {
        events.push({
          id: `schedule-${schedule.id}`,
          title: course.name,
          date: schedule.date,
          time: schedule.time,
          type: schedule.type,
          courseId: schedule.courseid,
          instructorId: schedule.instructorid,
          room: schedule.room || "",
          color: getEventColor(schedule.type),
        })
      }
    })

    return events
  }, [data.courses, data.exams, data.schedules, userCourses, user])

  const selectedDateEvents = getEventsForDate(calendarEvents, selectedDate)

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      alert("Please fill in all required fields (title, date, time).")
      return
    }

    try {
      if (editingSchedule) {
        const dateObj = new Date(formData.date);
        const dayofweek = dateObj.toLocaleDateString("en-US", { weekday: "long" });
        await supabase.from("schedules").update({
          ...editingSchedule,
          courseid: formData.courseId || editingSchedule.courseid,
          dayofweek,
          starttime: formData.time,
          endtime: formData.endTime,
          location: formData.room,
          instructorid: user?.id || editingSchedule.instructorid,
          type: formData.type,
          title: formData.title,
          description: formData.description ?? editingSchedule.description,
          date: formData.date,
          time: formData.time,
          // courseid: formData.courseId
        }).eq("id", editingSchedule.id)
        await refetch()
      } else {
        const dateObj = new Date(formData.date)
        const dayofweek = dateObj.toLocaleDateString("en-US", { weekday: "long" })
        const newSchedule: Schedule = {
          id: uuidv4(),
          
          dayofweek,
          starttime: formData.time,
          endtime: formData.endTime,
          location: formData.room,
          instructorid: user?.id || "",
          type: formData.type,
          title: formData.title,
          description: formData.description ?? "",
          date: formData.date,     
          time: formData.time,  
       courseid: formData.courseId 
        }
        const { error } = await supabase.from("schedules").insert([newSchedule])
        if (error) {
          alert("Failed to create event: " + error.message)
          return
        }
        await refetch()
      }
      resetForm()
    } catch (err) {
      alert("An error occurred while creating the event.")
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormData({
      title: editingSchedule?.title || "",
      date: editingSchedule?.date || "",
      time: editingSchedule?.time || "",
      endTime: editingSchedule?.endTime || "",
      type: editingSchedule?.type || "class",
      courseId: editingSchedule?.courseid || "",
      room: editingSchedule?.room || "",
      description: editingSchedule?.description || "",
    })
    setEditingSchedule(null)
    setIsDialogOpen(false)
  }

  const handleAddEvent = (date: string) => {
    setFormData({ ...formData, date })
    setIsDialogOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const handleEdit = (schedule: Schedule) => {
    const course = data.courses.find((c) => c.id === schedule.courseid)
    setEditingSchedule(schedule)
    setFormData({
      title: course?.name || "",
      date: schedule.date,
      time: schedule.time,
      endTime: "",
      type: schedule.type,
      courseId: schedule.courseid,
      room: schedule.room || "",
      description: schedule.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (scheduleId: string) => {
    await supabase.from("schedules").delete().eq("id", scheduleId)
    await refetch()
  }

  const getInstructorName = (instructorId: string) => {
    const instructor = data.users.find((u) => u.id === instructorId)
    return instructor?.name || "Unknown"
  }

  const getCourseName = (courseId: string) => {
    const course = data.courses.find((c) => c.id === courseId)
    return course?.name || "Unknown Course"
  }

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-60 z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4" />
        <span className="text-lg text-blue-700">Loading schedules...</span>
      </div>
    </div>
  )
  if (error) return <div className="text-red-500 p-6">Error loading schedules: {error}</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground">View and manage class schedules and events</p>
        </div>
        {canManageSchedules && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="today">Today's Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Calendar
                events={calendarEvents}
                selectedDate={selectedDate}
                onDateClick={setSelectedDate}
                onEventClick={handleEventClick}
                onAddEvent={canManageSchedules ? handleAddEvent : undefined}
              />
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={event.type === "exam" ? "destructive" : "default"}>{event.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatTime(event.time)}
                              {event.endTime && ` - ${formatTime(event.endTime)}`}
                            </span>
                          </div>
                          <h4 className="font-medium">{event.title}</h4>
                          {event.room && (
                            <p className="text-sm text-muted-foreground flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.room}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No events scheduled for this date</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.schedules
              .filter((schedule) => {
                const course = data.courses.find((c) => c.id === schedule.courseid)
                return (
                  course &&
                  (user?.role === "admin" ||
                    (user?.role === "instructor" && course.instructorid === user.id) ||
                    (user?.role === "student" && course.studentids.includes(user.id)))
                )
              })
              .map((schedule) => {
                const course = data.courses.find((c) => c.id === schedule.courseid)
                return (
                  <Card key={schedule.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{getCourseName(schedule.courseid || "")}</CardTitle>
                          <CardDescription>
                            <Badge variant={schedule.type === "exam" ? "destructive" : "default"}>
                              {schedule.type}
                            </Badge>
                          </CardDescription>
                        </div>
                        {canManageSchedules && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(schedule)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(schedule.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          {new Date(schedule.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatTime(schedule.time)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          {schedule.room}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          {getInstructorName(schedule.instructorid || "")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getEventsForDate(calendarEvents, formatDate(new Date())).length > 0 ? (
                <div className="space-y-4">
                  {getEventsForDate(calendarEvents, formatDate(new Date())).map((event) => (
                    <div key={event.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className={`w-4 h-4 rounded-full ${event.color}`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium">{event.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(event.time)}
                            {event.endTime && ` - ${formatTime(event.endTime)}`}
                          </span>
                          {event.room && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.room}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={event.type === "exam" ? "destructive" : "default"}>{event.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No events scheduled for today</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Edit Event" : "Add New Event"}</DialogTitle>
            <DialogDescription>
              {editingSchedule ? "Update event details" : "Create a new scheduled event"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>
            <div>
              <Label htmlFor="course">Course</Label>
              <Select
                value={formData.courseId || ""}
                onValueChange={(value) => setFormData({ ...formData, courseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {userCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select value={formData.type || ""} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ""}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time">Start Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time || ""}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime || ""}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                value={formData.room || ""}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Enter room number"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>{editingSchedule ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Event Details</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={selectedEvent.type === "exam" ? "destructive" : "default"}>{selectedEvent.type}</Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedEvent.date).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {formatTime(selectedEvent.time)}
                    {selectedEvent.endTime && ` - ${formatTime(selectedEvent.endTime)}`}
                  </span>
                </div>

                {selectedEvent.room && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedEvent.room}</span>
                  </div>
                )}

                {selectedEvent.instructorId && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{getInstructorName(selectedEvent.instructorId)}</span>
                  </div>
                )}

                {selectedEvent.courseId && (
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{getCourseName(selectedEvent.courseId)}</span>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}

              <Button onClick={() => setSelectedEvent(null)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
