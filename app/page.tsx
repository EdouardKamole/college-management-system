"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Login } from "@/components/login"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { Courses } from "@/components/courses"
import { Schedules } from "@/components/schedules"
import { Exams } from "@/components/exams"
import { Grades } from "@/components/grades"
import { UserManagement } from "@/components/user-management"
import { Resources } from "@/components/resources"

export default function Home() {
  const { user, isLoading } = useAuth()
  const [activeModule, setActiveModule] = useState("dashboard")

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard onModuleChange={setActiveModule} />
      case "courses":
        return <Courses />
      case "exams":
        return <Exams />
      case "grades":
        return <Grades />
      case "attendance":
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold">Attendance</h1>
            <p className="text-muted-foreground">Attendance tracking module coming soon...</p>
          </div>
        )
      case "resources":
        return <Resources />
      case "schedules":
        return <Schedules />
      case "users":
        return <UserManagement />
      default:
        return <Dashboard onModuleChange={setActiveModule} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="flex-1 overflow-auto">{renderModule()}</main>
    </div>
  )
}
