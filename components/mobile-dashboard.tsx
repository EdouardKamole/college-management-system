"use client"

import { useAuth } from "@/contexts/auth-context"
import { useMobileData } from "@/hooks/use-mobile-data"
import { MobileCard } from "@/components/mobile-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, FileText, GraduationCap, Calendar, TrendingUp, Clock, AlertCircle } from "lucide-react"

interface MobileDashboardProps {
  onModuleChange: (module: string) => void
}

export function MobileDashboard({ onModuleChange }: MobileDashboardProps) {
  const { user } = useAuth()
  const { data, lastSync, isOnline } = useMobileData()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const quickActions = [
    {
      title: "My Courses",
      description: `${data.courses?.length || 0} active courses`,
      icon: BookOpen,
      module: "courses",
      color: "bg-blue-500",
    },
    {
      title: "Examinations",
      description: "View upcoming exams",
      icon: FileText,
      module: "exams",
      color: "bg-red-500",
    },
    {
      title: "Grades",
      description: "Check your performance",
      icon: GraduationCap,
      module: "grades",
      color: "bg-green-500",
    },
    {
      title: "Schedule",
      description: "Today's classes",
      icon: Calendar,
      module: "schedules",
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-6">
        <h1 className="text-xl font-bold mb-2">
          {getGreeting()}, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-blue-100 text-sm">Welcome back to UAFC Management System</p>

        {/* Sync Status */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-xs text-blue-100">{isOnline ? "Online" : "Offline"}</span>
          </div>
          {lastSync && <span className="text-xs text-blue-100">Last sync: {lastSync.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <MobileCard
                key={action.module}
                title={action.title}
                description={action.description}
                onClick={() => onModuleChange(action.module)}
                className="text-center"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </MobileCard>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <MobileCard title="New Assignment Posted" description="Mathematics - Calculus Problem Set">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Assignment</Badge>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
          </MobileCard>

          <MobileCard title="Exam Reminder" description="Physics Midterm - Tomorrow at 9:00 AM">
            <div className="flex items-center justify-between">
              <Badge variant="destructive">Exam</Badge>
              <span className="text-xs text-gray-500">1 day</span>
            </div>
          </MobileCard>

          <MobileCard title="Grade Updated" description="Chemistry Lab Report - 85/100">
            <div className="flex items-center justify-between">
              <Badge variant="default">Grade</Badge>
              <span className="text-xs text-gray-500">3 days ago</span>
            </div>
          </MobileCard>
        </div>
      </div>

      {/* Performance Overview */}
      {user?.role === "student" && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
          <MobileCard title="Current GPA" description="Overall academic performance">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">3.75</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Dean's List</span>
                  <span>93%</span>
                </div>
                <Progress value={93} className="h-2" />
              </div>
            </div>
          </MobileCard>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
        <div className="space-y-3">
          <MobileCard title="Physics Lecture" description="Room 101 - Quantum Mechanics">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Today, 10:00 AM</span>
            </div>
          </MobileCard>

          <MobileCard title="Study Group" description="Mathematics - Library Room 3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Tomorrow, 2:00 PM</span>
            </div>
          </MobileCard>
        </div>
      </div>

      {/* Offline Notice */}
      {!isOnline && (
        <MobileCard
          title="Offline Mode"
          description="You're currently offline. Some features may be limited."
          className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800 dark:text-orange-200">
              Data will sync when connection is restored
            </span>
          </div>
        </MobileCard>
      )}
    </div>
  )
}
