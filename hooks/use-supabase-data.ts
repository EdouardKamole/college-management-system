"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type {
  User,
  Course,
  Exam,
  Grade,
  Attendance,
  Resource,
  Schedule,
  ExamSubmission,
  GradeCategory,
  CourseGrade,
  GradeScale,
  Transcript,
} from "@/lib/data"

interface AppData {
  users: User[]
  courses: Course[]
  exams: Exam[]
  grades: Grade[]
  attendance: Attendance[]
  resources: Resource[]
  schedules: Schedule[]
  examSubmissions: ExamSubmission[]
  gradeCategories: GradeCategory[]
  courseGrades: CourseGrade[]
  gradeScales: GradeScale[]
  transcripts: Transcript[]
}

export function useSupabaseData() {
  const [data, setData] = useState<AppData>({
    users: [],
    courses: [],
    exams: [],
    grades: [],
    attendance: [],
    resources: [],
    schedules: [],
    examSubmissions: [],
    gradeCategories: [],
    courseGrades: [],
    gradeScales: [],
    transcripts: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true)

      // Load users
      const { data: users, error: usersError } = await supabase.from("users").select("*")

      if (usersError) throw usersError

      // Load courses
      const { data: courses, error: coursesError } = await supabase.from("courses").select("*")

      if (coursesError) throw coursesError

      // Load resources
      const { data: resources, error: resourcesError } = await supabase.from("resources").select("*")

      if (resourcesError) throw resourcesError

      // Load other data...
      // For now, we'll use empty arrays for other tables

      setData({
        users: users || [],
        courses: courses || [],
        resources: resources || [],
        exams: [],
        grades: [],
        attendance: [],
        schedules: [],
        examSubmissions: [],
        gradeCategories: [],
        courseGrades: [],
        gradeScales: [],
        transcripts: [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Add user
  const addUser = async (userData: Omit<User, "id">) => {
    try {
      const { data: newUser, error } = await supabase.from("users").insert([userData]).select().single()

      if (error) throw error

      setData((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
      }))

      return newUser
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to add user")
    }
  }

  // Update user
  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      const { data: updatedUser, error } = await supabase.from("users").update(userData).eq("id", id).select().single()

      if (error) throw error

      setData((prev) => ({
        ...prev,
        users: prev.users.map((user) => (user.id === id ? updatedUser : user)),
      }))

      return updatedUser
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to update user")
    }
  }

  // Delete user
  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) throw error

      setData((prev) => ({
        ...prev,
        users: prev.users.filter((user) => user.id !== id),
      }))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to delete user")
    }
  }

  // Add resource
  const addResource = async (resourceData: Omit<Resource, "id">) => {
    try {
      const { data: newResource, error } = await supabase.from("resources").insert([resourceData]).select().single()

      if (error) throw error

      setData((prev) => ({
        ...prev,
        resources: [...prev.resources, newResource],
      }))

      return newResource
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to add resource")
    }
  }

  // Update resource
  const updateResource = async (id: string, resourceData: Partial<Resource>) => {
    try {
      const { data: updatedResource, error } = await supabase
        .from("resources")
        .update(resourceData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setData((prev) => ({
        ...prev,
        resources: prev.resources.map((resource) => (resource.id === id ? updatedResource : resource)),
      }))

      return updatedResource
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to update resource")
    }
  }

  // Delete resource
  const deleteResource = async (id: string) => {
    try {
      const { error } = await supabase.from("resources").delete().eq("id", id)

      if (error) throw error

      setData((prev) => ({
        ...prev,
        resources: prev.resources.filter((resource) => resource.id !== id),
      }))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to delete resource")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: loadData,
    // User operations
    addUser,
    updateUser,
    deleteUser,
    // Resource operations
    addResource,
    updateResource,
    deleteResource,
  }
}
