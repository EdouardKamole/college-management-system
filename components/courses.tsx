"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSupabaseData } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, Clock } from "lucide-react";
import type { Course } from "@/lib/data";

export function Courses() {
  const { user } = useAuth();
  const { data, addCourse, updateCourse, deleteCourse, loading, error } = useSupabaseData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule: "",
    studentids: [] as string[],
  });

  const canManageCourses = user?.role === "admin" || user?.role === "instructor";
  
  // Safely get user courses with null checks
  const userCourses = React.useMemo(() => {
    if (!data?.courses) return [];
    
    return user?.role === "instructor"
      ? data.courses.filter((c) => c.instructorid === user.id)
      : user?.role === "student"
      ? data.courses.filter((c) => c.studentids?.includes?.(user.id) ?? false)
      : data.courses || [];
  }, [data?.courses, user?.role, user?.id]);

  const instructors = data.users.filter((u) => u.role === "instructor");

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.schedule) return;

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
      } else {
        await addCourse({
          ...formData,
          instructorid: user?.id || "",
          studentids: formData.studentids,
          requirededucationlevel: ["UACE"],
          requiredsubjects: [],
          minimumpoints: 0,
          passmark: 50,
          duration: "6",
          category: "technical",
        });
      }
      setFormData({ name: "", description: "", schedule: "", studentids: [] });
      setEditingCourse(null);
      setIsDialogOpen(false);
    } catch (err) {
      // Optionally handle error (e.g., show toast)
      console.error(err);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description,
      schedule: course.schedule,
      studentids: course.studentids ?? [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
    } catch (err) {
      // Optionally handle error (e.g., show toast)
      console.error(err);
    }
  };

  const getInstructorName = (instructorid: string) => {
    const instructor = instructors.find((i) => i.id === instructorid);
    return instructor?.name || "Unknown";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">
            {canManageCourses ? "Manage all courses" : "View your courses"}
          </p>
        </div>
        {canManageCourses && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCourse(null);
                  setFormData({ name: "", description: "", schedule: "", studentids: [] });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </DialogTitle>
                <DialogDescription>
                  {editingCourse
                    ? "Update course information"
                    : "Create a new course"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter course name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter course description"
                  />
                </div>
                <div>
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                    placeholder="e.g., Mon, Wed, Fri 09:00-10:30"
                  />
                </div>
                <div>
                  <Label htmlFor="studentids">Enroll Students</Label>
                  <select
                    id="studentids"
                    multiple
                    className="w-full border rounded p-2"
                    value={formData.studentids}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value)
                      setFormData({ ...formData, studentids: selected })
                    }}
                  >
                    {data.users.filter(u => u.role === "student").map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingCourse ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error loading courses: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      ) : userCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {course.description}
                  </CardDescription>
                </div>
                {canManageCourses && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(course)}
                    >
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
                  {course.studentids?.length || 0} students enrolled
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {getInstructorName(course.instructorid)}
                  </Badge>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
