"use client"

import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/hooks/use-data"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileDashboard } from "@/components/mobile-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, FileText, Calendar, TrendingUp, Award, AlertCircle } from "lucide-react"

interface DashboardProps {
  onModuleChange: (module: string) => void
}

export function Dashboard({ onModuleChange }: DashboardProps) {
  const { user } = useAuth()
  const { data } = useData()
  const isMobile = useIsMobile()

  // Use mobile dashboard on mobile devices
  if (isMobile) {
    return <MobileDashboard onModuleChange={onModuleChange} />
  }

  // Rest of the existing desktop dashboard code remains the same...
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const getStats = () => {
    if (user?.role === "admin") {
      return {
        totalCourses: data.courses.length,
        totalStudents: data.users.filter((u) => u.role === "student").length,
        totalInstructors: data.users.filter((u) => u.role === "instructor").length,
        totalExams: data.exams.length,
      }
    } else if (user?.role === "instructor") {
      const myCourses = data.courses.filter((c) => c.instructorId === user.id)
      const myStudents = new Set(myCourses.flatMap((c) => c.studentIds)).size
      const myExams = data.exams.filter((e) => myCourses.some((c) => c.id === e.courseId))
      return {
        myCourses: myCourses.length,
        myStudents,
        myExams: myExams.length,
        pendingGrades: data.grades.filter((g) => myExams.some((e) => e.id === g.examId) && !g.remarks).length,
      }
    } else {
      const myCourses = data.courses.filter((c) => c.studentIds.includes(user?.id || ""))
      const myGrades = data.grades.filter((g) => g.studentId === user?.id)
      const myAttendance = data.attendance.filter((a) => a.studentId === user?.id)
      const attendanceRate =
        myAttendance.length > 0
          ? (myAttendance.filter((a) => a.status === "present").length / myAttendance.length) * 100
          : 0
      return {
        enrolledCourses: myCourses.length,
        totalGrades: myGrades.length,
        averageGrade:
          myGrades.length > 0
            ? Math.round(myGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / myGrades.length)
            : 0,
        attendanceRate: Math.round(attendanceRate),
      }
    }
  }

  const stats = getStats()

  const quickLinks = [
    { label: "Manage Courses", module: "courses", icon: BookOpen, roles: ["admin"] },
    { label: "View Courses", module: "courses", icon: BookOpen, roles: ["instructor", "student"] },
    { label: "Examinations", module: "exams", icon: FileText, roles: ["admin", "instructor", "student"] },
    { label: "Grade Management", module: "grades", icon: Award, roles: ["admin", "instructor"] },
    { label: "View Grades", module: "grades", icon: Award, roles: ["student"] },
    { label: "Attendance", module: "attendance", icon: Users, roles: ["admin", "instructor", "student"] },
    { label: "Schedules", module: "schedules", icon: Calendar, roles: ["admin", "instructor", "student"] },
  ].filter((link) => link.roles.includes(user?.role || ""))

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-blue-100">Welcome to the Uganda Air Force College Management System</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === "admin" && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">Active courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">Enrolled students</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instructors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInstructors}</div>
                <p className="text-xs text-muted-foreground">Active instructors</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalExams}</div>
                <p className="text-xs text-muted-foreground">Scheduled exams</p>
              </CardContent>
            </Card>
          </>
        )}

        {user?.role === "instructor" && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myCourses}</div>
                <p className="text-xs text-muted-foreground">Assigned courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myStudents}</div>
                <p className="text-xs text-muted-foreground">Total students</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Exams</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myExams}</div>
                <p className="text-xs text-muted-foreground">Created exams</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Grades</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingGrades}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </>
        )}

        {user?.role === "student" && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.enrolledCourses}</div>
                <p className="text-xs text-muted-foreground">Active enrollments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageGrade}%</div>
                <p className="text-xs text-muted-foreground">Overall performance</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">Class attendance</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalGrades}</div>
                <p className="text-xs text-muted-foreground">Graded exams</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access frequently used modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Button
                  key={link.module}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => onModuleChange(link.module)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm">{link.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">System updated successfully</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New course materials uploaded</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Upcoming exam reminder</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
