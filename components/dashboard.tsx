"use client";

import { useAuth } from "@/contexts/auth-context";
import { useSupabaseData } from "@/hooks/use-supabase-data";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDashboard } from "@/components/mobile-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileText, Calendar, TrendingUp, Award, AlertCircle } from "lucide-react";

interface DashboardProps {
  onModuleChange: (module: string) => void;
}

interface DashboardStats {
  // Admin stats
  totalCourses?: number;
  totalStudents?: number;
  totalInstructors?: number;
  totalExams?: number;
  
  // Instructor stats
  myCourses?: number;
  myStudents?: number;
  myExams?: number;
  pendingGrades?: number;
  
  // Student stats
  enrolledCourses?: number;
  totalGrades?: number;
  averageGrade?: number;
  attendanceRate?: number;
}

interface DashboardProps {
  onModuleChange: (module: string) => void;
}

export function Dashboard({ onModuleChange }: DashboardProps) {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useSupabaseData();
  const [isLoading, setIsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const isMobile = useIsMobile();

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to relevant tables
    const channels = [
      'courses',
      'users',
      'exams',
      'grades',
      'attendance'
    ].map(table => 
      supabase.channel(`${table}-changes`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table,
            ...(user.role !== 'admin' ? { 
              filter: `instructor_id=eq.${user.id}` 
            } : {})
          }, 
          (payload) => {
            console.log(`${table} update:`, payload);
            refetch();
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, refetch]);

  // Calculate stats when data changes
  useEffect(() => {
    const calculateStats = () => {
      if (!user || !data.courses || !data.users || !data.exams || !data.grades || !data.attendance) {
        return null;
      }

      try {
        let newStats: DashboardStats = {};

        if (user.role === "admin") {
          newStats = {
            totalCourses: data.courses?.length || 0,
            totalStudents: data.users.filter((u) => u.role === "student").length,
            totalInstructors: data.users.filter((u) => u.role === "instructor").length,
            totalExams: data.exams?.length || 0,
          };
        } else if (user.role === "instructor") {
          const myCourses = data.courses.filter((c) => c.instructorid === user.id);
          const myStudents = new Set(myCourses.flatMap((c) => c.studentids || [])).size;
          const myExams = data.exams.filter((e) =>
            myCourses.some((c) => c.id === e.courseid)
          );
          
          newStats = {
            myCourses: myCourses.length,
            myStudents,
            myExams: myExams.length,
            pendingGrades: data.grades.filter((g) =>
              myExams.some((e) => e.id === g.examid && (!g.score || g.score === 0))
            ).length,
          };
        } else {
          const myCourses = data.courses.filter((c) =>
            c.studentids?.includes(user.id) || false
          );
          const myGrades = data.grades.filter((g) => g.studentid === user.id && g.score);
          const myAttendance = data.attendance.filter(
            (a) => a.studentid === user.id
          );
          const attendanceRate =
            myAttendance.length > 0
              ? (myAttendance.filter((a) => a.status === "present").length /
                  myAttendance.length) *
                100
              : 0;
                
          const averageGrade = myGrades.length > 0
            ? Math.round(
                myGrades.reduce(
                  (sum, g) => sum + (g.score / g.maxscore) * 100,
                  0
                ) / myGrades.length
              )
            : 0;

          newStats = {
            enrolledCourses: myCourses.length,
            totalGrades: myGrades.length,
            averageGrade,
            attendanceRate: Math.round(attendanceRate),
          };
        }

        setStats(newStats);
        setStatsError(null);
      } catch (err) {
        console.error("Error calculating dashboard stats:", err);
        setStatsError("Failed to load dashboard statistics. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };

    calculateStats();
  }, [user, data]);

  // Use mobile dashboard on mobile devices
  if (loading || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-60 z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4" />
          <span className="text-lg text-blue-700">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || statsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || statsError || 'An unknown error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isMobile) {
    return <MobileDashboard onModuleChange={onModuleChange} />;
  }
  
  if (!stats) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There is no data to display. Please check back later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const quickLinks = [
    {
      label: "Manage Courses",
      module: "courses",
      icon: BookOpen,
      roles: ["admin"],
    },
    {
      label: "View Courses",
      module: "courses",
      icon: BookOpen,
      roles: ["instructor", "student"],
    },
    {
      label: "Examinations",
      module: "exams",
      icon: FileText,
      roles: ["admin", "instructor", "student"],
    },
    {
      label: "Grade Management",
      module: "grades",
      icon: Award,
      roles: ["admin", "instructor"],
    },
    { label: "View Grades", module: "grades", icon: Award, roles: ["student"] },
    {
      label: "Attendance",
      module: "attendance",
      icon: Users,
      roles: ["admin", "instructor", "student"],
    },
    {
      label: "Schedules",
      module: "schedules",
      icon: Calendar,
      roles: ["admin", "instructor", "student"],
    },
  ].filter((link) => link.roles.includes(user?.role || ""));

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
        {/* <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {user?.name}!
        </h1> */}
        <h1 className="text-2xl font-bold">
          Welcome to the Uganda Air Force College Intelligent College Management System
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === "admin" && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">Active courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Enrolled students
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Instructors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalInstructors}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active instructors
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Exams
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  My Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Assigned courses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  My Students
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Pending Grades
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Enrolled Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.enrolledCourses}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active enrollments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Grade
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageGrade}%</div>
                <p className="text-xs text-muted-foreground">
                  Overall performance
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Attendance Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.attendanceRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Class attendance
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Grades
                </CardTitle>
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
              const Icon = link.icon;
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
              );
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
                <p className="text-sm font-medium">
                  System updated successfully
                </p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  New course materials uploaded
                </p>
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
  );
}
