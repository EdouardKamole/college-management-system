"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/hooks/use-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, Clock } from "lucide-react"
import type { Course } from "@/lib/data"

export function Courses() {
  const { user } = useAuth()
  const { data, updateData } = useData()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule: "",
  })

  const canManageCourses = user?.role === "admin"
  const userCourses =
    user?.role === "instructor"
      ? data.courses.filter((c) => c.instructorId === user.id)
      : user?.role === "student"
        ? data.courses.filter((c) => c.studentIds.includes(user.id))
        : data.courses

  const instructors = data.users.filter((u) => u.role === "instructor")

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.schedule) return

    if (editingCourse) {
      const updatedCourses = data.courses.map((c) => (c.id === editingCourse.id ? { ...c, ...formData } : c))
      updateData({ courses: updatedCourses })
    } else {
      const newCourse: Course = {
        id: Date.now().toString(),
        ...formData,
        instructorId: user?.id || "",
        studentIds: [],
      }
      updateData({ courses: [...data.courses, newCourse] })
    }

    setFormData({ name: "", description: "", schedule: "" })
    setEditingCourse(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      description: course.description,
      schedule: course.schedule,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (courseId: string) => {
    const updatedCourses = data.courses.filter((c) => c.id !== courseId)
    updateData({ courses: updatedCourses })
  }

  const getInstructorName = (instructorId: string) => {
    const instructor = instructors.find((i) => i.id === instructorId)
    return instructor?.name || "Unknown"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">{canManageCourses ? "Manage all courses" : "View your courses"}</p>
        </div>
        {canManageCourses && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCourse(null)
                  setFormData({ name: "", description: "", schedule: "" })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
                <DialogDescription>
                  {editingCourse ? "Update course information" : "Create a new course"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter course name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter course description"
                  />
                </div>
                <div>
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="e.g., Mon, Wed, Fri 09:00-10:30"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>{editingCourse ? "Update" : "Create"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription className="mt-2">{course.description}</CardDescription>
                </div>
                {canManageCourses && (
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(course)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(course.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  {course.schedule}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  {course.studentIds.length} students enrolled
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{getInstructorName(course.instructorId)}</Badge>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {userCourses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {canManageCourses
                  ? "Get started by creating your first course"
                  : "You are not enrolled in any courses yet"}
              </p>
              {canManageCourses && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
