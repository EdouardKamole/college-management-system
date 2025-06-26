"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { GradeBook } from "@/components/grade-book"
import { TranscriptGenerator } from "@/components/transcript-generator"
import { GradeAnalytics } from "@/components/grade-analytics"
import { Plus, Download, BarChart3, FileText, Calculator, TrendingUp } from "lucide-react"
import { calculateCourseGrade, calculateLetterGrade, calculateGPA } from "@/lib/grade-utils"
import type { Grade } from "@/lib/data"

export function Grades() {
  const { user } = useAuth()
  const { data, addGrade, updateGrade, deleteGrade, refetch } = useSupabaseData()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false)
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [gradeForm, setGradeForm] = useState({
    studentId: "",
    category: "",
    name: "",
    score: "",
    maxScore: "",
    weight: "1",
    feedback: "",
    late: false,
    excused: false,
  })

  const canManageGrades = user?.role === "admin" || user?.role === "instructor"
  const defaultGradeScale = data.gradeScales.find((gs) => gs.id === "default")!

  // Filter courses based on user role with null checks
  const userCourses = useMemo(() => {
    try {
      if (!data.courses) return []
      
      if (user?.role === "admin") return data.courses
      if (user?.role === "instructor") 
        return data.courses.filter((c) => c.instructorId === user.id)
      if (user?.role === "student") 
        return data.courses.filter((c) => c.studentIds?.includes(user.id) || false)
      
      return []
    } catch (err) {
      console.error("Error filtering courses:", err)
      setError("Failed to load courses. Please refresh the page.")
      return []
    }
  }, [data.courses, user])

  // Calculate student's overall GPA with error handling
  const studentGPA = useMemo(() => {
    try {
      if (user?.role !== "student") return null
      if (!data.courseGrades) return null
      
      const studentCourseGrades = data.courseGrades.filter((cg) => cg.studentId === user.id)
      return calculateGPA(studentCourseGrades)
    } catch (err) {
      console.error("Error calculating GPA:", err)
      setError("Failed to calculate GPA. Please try again.")
      return null
    }
  }, [data.courseGrades, user])

  // Get grade statistics with error handling
  const gradeStats = useMemo(() => {
    try {
      if (user?.role === "student") {
        const studentGrades = data.grades?.filter((g) => g.studentId === user.id) || []
        const totalGrades = studentGrades.length
        const averageScore =
          totalGrades > 0 ? studentGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / totalGrades : 0

        return {
          totalGrades,
          averageScore: Math.round(averageScore * 100) / 100,
          coursesEnrolled: userCourses.length,
          gpa: studentGPA || 0,
        }
      } else {
        const instructorCourses = userCourses || []
        const totalStudents = new Set(instructorCourses.flatMap((c) => c.studentIds || [])).size
        const totalGrades = data.grades?.filter((g) => 
          instructorCourses.some((c) => c.id === g.courseId)
        ).length || 0

        return {
          coursesTeaching: instructorCourses.length,
          totalStudents,
          totalGrades,
          pendingGrades: data.examSubmissions?.filter(
            (s) =>
              s.status === "submitted" &&
              instructorCourses.some(
                (c) => data.exams?.find((e) => e.id === s.examId)?.courseId === c.id
              )
          ).length || 0,
        }
      }
    } catch (err) {
      console.error("Error calculating grade stats:", err)
      setError("Failed to load grade statistics. Please try again.")
      return {
        totalGrades: 0,
        averageScore: 0,
        coursesEnrolled: 0,
        gpa: 0,
        coursesTeaching: 0,
        totalStudents: 0,
        pendingGrades: 0,
      }
    }
  }, [data, user, userCourses, studentGPA])

  // Set up real-time subscription for grades
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('grades-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'grades',
          filter: user.role === 'student' 
            ? `student_id=eq.${user.id}`
            : undefined
        }, 
        (payload) => {
          console.log('Grades update:', payload)
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user, refetch])

  const handleAddGrade = async () => {
    try {
      if (!gradeForm.studentId || !gradeForm.name || !gradeForm.score || !gradeForm.maxScore || !selectedCourse) {
        toast.error("Please fill in all required fields")
        return
      }
      
      setIsLoading(true)
      setError(null)

      const newGrade: Omit<Grade, "id"> = {
        studentId: gradeForm.studentId,
        courseId: selectedCourse,
        category: gradeForm.category || "assignment",
        name: gradeForm.name,
        score: Number(gradeForm.score),
        maxScore: Number(gradeForm.maxScore),
        weight: Number(gradeForm.weight) || 1,
        date: new Date().toISOString(),
        feedback: gradeForm.feedback || "",
        late: gradeForm.late,
        excused: gradeForm.excused,
      }
      
      const { error } = await addGrade(newGrade)

      if (error) throw error
      
      toast.success("Grade added successfully")
      setIsAddGradeOpen(false)
      setGradeForm({
        studentId: "",
        category: "",
        name: "",
        score: "",
        maxScore: "",
        weight: "1",
        feedback: "",
        late: false,
        excused: false,
      })
    } catch (error) {
      console.error("Error adding grade:", error)
      setError(error instanceof Error ? error.message : "Failed to add grade. Please try again.")
      toast.error("Failed to add grade")
    } finally {
      setIsLoading(false)
    }
  }

  const exportGrades = () => {
    try {
      if (!selectedCourse) {
        alert("Please select a course first")
        return
      }

      const courseGrades = data.grades.filter((g) => g.courseId === selectedCourse)
      const course = data.courses.find((c) => c.id === selectedCourse)

      if (courseGrades.length === 0) {
        alert("No grades to export for this course")
        return
      }

      const csvContent = [
        ["Student ID", "Student Name", "Assignment", "Category", "Score", "Max Score", "Percentage", "Date", "Feedback"],
        ...courseGrades.map((grade) => {
          const student = data.users.find((u) => u.id === grade.studentId)
          const percentage = ((grade.score / grade.maxScore) * 100).toFixed(2)
          return [
            grade.studentId,
            student?.name || "Unknown",
            grade.name,
            grade.category,
            grade.score.toString(),
            grade.maxScore.toString(),
            `${percentage}%`,
            new Date(grade.date).toLocaleDateString(),
            grade.feedback || "",
          ]
        }),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${course?.name || "course"}_grades.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting grades:", error)
      alert("Failed to export grades. Please try again.")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Grade Management</h1>
          <p className="text-muted-foreground">
            {canManageGrades ? "Manage grades and generate reports" : "View your academic progress"}
          </p>
        </div>
        {canManageGrades && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsTranscriptOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Transcript
            </Button>
            <Button onClick={() => setIsAddGradeOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Grade
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {user?.role === "student" && <TabsTrigger value="my-grades">My Grades</TabsTrigger>}
          {canManageGrades && <TabsTrigger value="gradebook">Grade Book</TabsTrigger>}
          {canManageGrades && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {user?.role === "student" ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{gradeStats.gpa?.toFixed(2) || 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">4.0 Scale</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{gradeStats.averageScore}%</div>
                    <p className="text-xs text-muted-foreground">All assignments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{gradeStats.coursesEnrolled}</div>
                    <p className="text-xs text-muted-foreground">Active courses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{gradeStats.totalGrades}</div>
                    <p className="text-xs text-muted-foreground">Recorded grades</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Courses Teaching</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{gradeStats.coursesTeaching}</div>
                    <p className="text-xs text-muted-foreground">Active courses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{gradeStats.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">Enrolled students</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{gradeStats.totalGrades}</div>
                    <p className="text-xs text-muted-foreground">Recorded grades</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Grades</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{gradeStats.pendingGrades}</div>
                    <p className="text-xs text-muted-foreground">Need grading</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Course Grade Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Course Grades Summary</CardTitle>
              <CardDescription>
                {user?.role === "student" ? "Your current grades in all courses" : "Grade overview for your courses"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userCourses.map((course) => {
                  const courseCategories = data.gradeCategories.filter((gc) => gc.courseId === course.id)

                  if (user?.role === "student") {
                    const studentGrades = data.grades.filter((g) => g.courseId === course.id && g.studentId === user.id)
                    const { percentage } = calculateCourseGrade(studentGrades, courseCategories, course.id)
                    const { letter } = calculateLetterGrade(percentage, defaultGradeScale)

                    return (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{course.name}</h4>
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-bold">{percentage.toFixed(1)}%</div>
                            <Badge
                              variant={percentage >= 90 ? "default" : percentage >= 80 ? "secondary" : "destructive"}
                            >
                              {letter}
                            </Badge>
                          </div>
                          <div className="w-32">
                            <Progress value={percentage} className="h-2" />
                          </div>
                        </div>
                      </div>
                    )
                  } else {
                    const courseGrades = data.grades.filter((g) => g.courseId === course.id)
                    const studentCount = course.studentIds.length
                    const averageGrade =
                      courseGrades.length > 0
                        ? courseGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / courseGrades.length
                        : 0

                    return (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{course.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {studentCount} students • {courseGrades.length} grades recorded
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-bold">{averageGrade.toFixed(1)}%</div>
                            <p className="text-sm text-muted-foreground">Class Average</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCourse(course.id)
                              setActiveTab("gradebook")
                            }}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === "student" && (
          <TabsContent value="my-grades" className="space-y-6">
            <div className="space-y-6">
              {userCourses.map((course) => {
                const studentGrades = data.grades.filter((g) => g.courseId === course.id && g.studentId === user.id)
                const courseCategories = data.gradeCategories.filter((gc) => gc.courseId === course.id)
                const { percentage, breakdown } = calculateCourseGrade(studentGrades, courseCategories, course.id)
                const { letter } = calculateLetterGrade(percentage, defaultGradeScale)

                return (
                  <Card key={course.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{course.name}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
                          <Badge
                            variant={percentage >= 90 ? "default" : percentage >= 80 ? "secondary" : "destructive"}
                          >
                            {letter}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Category Breakdown */}
                        <div>
                          <h4 className="font-medium mb-3">Grade Breakdown</h4>
                          <div className="space-y-2">
                            {courseCategories.map((category) => {
                              const categoryGrades = studentGrades.filter(
                                (g) => g.category === category.name.toLowerCase(),
                              )
                              const categoryPercentage = breakdown[category.id] || 0

                              return (
                                <div key={category.id} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                                    <span className="text-sm">
                                      {category.name} ({category.weight}%)
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium">{categoryPercentage.toFixed(1)}%</span>
                                    <div className="w-20">
                                      <Progress value={categoryPercentage} className="h-1" />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Individual Grades */}
                        <div>
                          <h4 className="font-medium mb-3">Individual Grades</h4>
                          <div className="space-y-2">
                            {studentGrades.map((grade) => (
                              <div
                                key={grade.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{grade.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {grade.category}
                                    </Badge>
                                    {grade.late && (
                                      <Badge variant="destructive" className="text-xs">
                                        Late
                                      </Badge>
                                    )}
                                    {grade.excused && (
                                      <Badge variant="secondary" className="text-xs">
                                        Excused
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(grade.date).toLocaleDateString()}
                                  </p>
                                  {grade.feedback && (
                                    <p className="text-sm text-muted-foreground mt-1">{grade.feedback}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-bold">
                                    {grade.score}/{grade.maxScore}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {((grade.score / grade.maxScore) * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        )}

        {canManageGrades && (
          <>
            <TabsContent value="gradebook" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="course-select">Select Course:</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-64 mt-1">
                      <SelectValue placeholder="Choose a course" />
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
                {selectedCourse && (
                  <Button variant="outline" onClick={exportGrades}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>

              {selectedCourse && (
                <GradeBook
                  courseId={selectedCourse}
                  grades={data.grades}
                  categories={data.gradeCategories}
                  students={data.users.filter((u) => u.role === "student")}
                  gradeScale={defaultGradeScale}
                  onUpdateGrade={async (gradeId, updates) => {
                    await updateGrade(gradeId, updates)
                  }}
                  onDeleteGrade={(gradeId) => {
                    deleteGrade(gradeId)
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <GradeAnalytics
                courses={userCourses}
                grades={data.grades}
                students={data.users.filter((u) => u.role === "student")}
                gradeScale={defaultGradeScale}
              />
            </TabsContent>
          </>
        )}

        <TabsContent value="transcripts" className="space-y-6">
          <TranscriptGenerator
            students={data.users.filter((u) => u.role === "student")}
            courses={data.courses}
            grades={data.grades}
            courseGrades={data.courseGrades}
            gradeScale={defaultGradeScale}
            currentUser={user}
            onGenerateTranscript={async (transcript) => {
              try {
                const { error } = await supabase
                  .from("transcripts")
                  .insert([transcript])
                
                if (error) {
                  throw error
                }
                await refetch()
                alert("Transcript generated successfully!")
              } catch (error) {
                console.error("Error generating transcript:", error)
                alert("Failed to generate transcript. Please try again.")
              }
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Add Grade Dialog */}
      <Dialog open={isAddGradeOpen} onOpenChange={setIsAddGradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Grade</DialogTitle>
            <DialogDescription>Enter grade information for a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course">Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
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
                <Label htmlFor="student">Student</Label>
                <Select
                  value={gradeForm.studentId}
                  onValueChange={(value) => setGradeForm({ ...gradeForm, studentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCourse &&
                      data.courses
                        .find((c) => c.id === selectedCourse)
                        ?.studentIds.map((studentId) => {
                          const student = data.users.find((u) => u.id === studentId)
                          return (
                            <SelectItem key={studentId} value={studentId}>
                              {student?.name}
                            </SelectItem>
                          )
                        })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={gradeForm.category}
                  onValueChange={(value) => setGradeForm({ ...gradeForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="participation">Participation</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Assignment Name</Label>
                <Input
                  id="name"
                  value={gradeForm.name}
                  onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                  placeholder="e.g., Midterm Exam"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  type="number"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                  placeholder="85"
                />
              </div>
              <div>
                <Label htmlFor="maxScore">Max Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  value={gradeForm.maxScore}
                  onChange={(e) => setGradeForm({ ...gradeForm, maxScore: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={gradeForm.weight}
                  onChange={(e) => setGradeForm({ ...gradeForm, weight: e.target.value })}
                  placeholder="1.0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                placeholder="Provide feedback for the student..."
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="late"
                  checked={gradeForm.late}
                  onChange={(e) => setGradeForm({ ...gradeForm, late: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="late">Late Submission</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="excused"
                  checked={gradeForm.excused}
                  onChange={(e) => setGradeForm({ ...gradeForm, excused: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="excused">Excused</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddGradeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGrade}>Add Grade</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}