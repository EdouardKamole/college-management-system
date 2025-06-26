"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
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
import { Plus, Download, BarChart3, FileText, Calculator, TrendingUp } from "lucide-react"
import { calculateLetterGrade } from "@/lib/grade-utils"
import { supabase } from "@/lib/supabase"

type Grade = {
  id: string
  student_id: string
  course_id: string
  category: string
  name: string
  score: number
  max_score: number
  weight: number
  date: string
  feedback?: string
  late: boolean
  excused: boolean
  exam_id?: string
}

type Course = {
  id: string
  name: string
  description: string
  instructor_id: string
  student_ids: string[]
}

type User = {
  id: string
  name: string
  email: string
  role: "admin" | "instructor" | "student"
}

interface GradeFormData {
  student_id: string
  course_id: string
  name: string
  score: string
  max_score: string
  weight: string
  category: string
  feedback: string
  late: boolean
  excused: boolean
}

export function GradesSupabase() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for data from Supabase
  const [courses, setCourses] = useState<Course[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<User[]>([])

  const [gradeForm, setGradeForm] = useState<GradeFormData>({
    student_id: "",
    course_id: selectedCourse || "",
    name: "",
    score: "",
    max_score: "",
    weight: "1",
    category: "assignment",
    feedback: "",
    late: false,
    excused: false,
  })

  const canManageGrades = user?.role === "admin" || user?.role === "instructor"

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch courses based on user role
        let coursesQuery = supabase.from('courses').select('*')
        
        if (user?.role === 'instructor') {
          coursesQuery = coursesQuery.eq('instructor_id', user.id)
        } else if (user?.role === 'student') {
          coursesQuery = coursesQuery.contains('student_ids', [user.id])
        }
        
        const { data: coursesData, error: coursesError } = await coursesQuery
        if (coursesError) throw coursesError
        setCourses(coursesData || [])

        // Set default selected course if not set
        if (coursesData?.length && !selectedCourse) {
          setSelectedCourse(coursesData[0].id)
        }

        // Fetch grades
        let gradesQuery = supabase.from('grades').select('*')
        
        if (user?.role === 'student') {
          gradesQuery = gradesQuery.eq('student_id', user.id)
        } else if (selectedCourse) {
          gradesQuery = gradesQuery.eq('course_id', selectedCourse)
        }
        
        const { data: gradesData, error: gradesError } = await gradesQuery
        if (gradesError) throw gradesError
        setGrades(gradesData || [])

        // Fetch students if admin/instructor
        if (canManageGrades) {
          const { data: studentsData, error: studentsError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('role', 'student')
          
          if (studentsError) throw studentsError
          setStudents(studentsData || [])
        }

      } catch (error: any) {
        console.error('Error fetching data:', error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, selectedCourse, canManageGrades])

  // Set up real-time subscription for grades
  useEffect(() => {
    const channel = supabase
      .channel('grades_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grades',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGrades(current => [...current, payload.new as Grade])
          } else if (payload.eventType === 'UPDATE') {
            setGrades(current => 
              current.map(grade => 
                grade.id === payload.new.id ? payload.new as Grade : grade
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setGrades(current => current.filter(grade => grade.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filter courses based on user role
  const userCourses = useMemo(() => {
    if (!user) return []
    if (user.role === "admin") return courses
    if (user.role === "instructor") return courses.filter(c => c.instructor_id === user.id)
    if (user.role === "student") return courses.filter(c => c.student_ids.includes(user.id))
    return []
  }, [courses, user])

  // Get students for the selected course
  const courseStudents = useMemo(() => {
    if (!selectedCourse) return []
    const course = courses.find(c => c.id === selectedCourse)
    if (!course?.student_ids) return []
    return students.filter(student => course.student_ids.includes(student.id))
  }, [selectedCourse, courses, students])

  // Calculate student's overall GPA
  const studentGPA = useMemo(() => {
    if (user?.role !== "student") return null
    
    const studentGrades = grades.filter(g => g.student_id === user.id)
    if (studentGrades.length === 0) return null
    
    const totalScore = studentGrades.reduce((sum, grade) => {
      return sum + (grade.score / grade.max_score) * 4.0 // Convert to 4.0 scale
    }, 0)
    
    return totalScore / studentGrades.length
  }, [grades, user])

  // Get grade statistics
  const gradeStats = useMemo(() => {
    if (!user) return {}
    
    if (user.role === "student") {
      const studentGrades = grades.filter(g => g.student_id === user.id)
      const totalGrades = studentGrades.length
      const averageScore = totalGrades > 0 
        ? studentGrades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / totalGrades 
        : 0

      return {
        gpa: studentGPA || 0,
        averageScore: Math.round(averageScore * 100) / 100,
        coursesEnrolled: userCourses.length,
        totalGrades,
      }
    } else {
      const instructorCourses = userCourses
      const totalStudents = new Set(instructorCourses.flatMap(c => c.student_ids || [])).size
      const totalGrades = grades.filter(g => 
        instructorCourses.some(c => c.id === g.course_id)
      ).length

      return {
        coursesTeaching: instructorCourses.length,
        totalStudents,
        totalGrades,
        pendingGrades: 0, // You can implement this based on your requirements
      }
    }
  }, [grades, user, userCourses, studentGPA])

  const handleAddGrade = async () => {
    if (!gradeForm.course_id || !gradeForm.student_id || !gradeForm.name || !gradeForm.score || !gradeForm.max_score) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const newGrade = {
        student_id: gradeForm.student_id,
        course_id: gradeForm.course_id,
        name: gradeForm.name,
        category: gradeForm.category || 'assignment',
        score: parseFloat(gradeForm.score),
        max_score: parseFloat(gradeForm.max_score),
        weight: parseFloat(gradeForm.weight) || 1,
        feedback: gradeForm.feedback || '',
        late: gradeForm.late,
        excused: gradeForm.excused,
        date: new Date().toISOString(),
      }


      const { error } = await supabase
        .from('grades')
        .insert([newGrade])

      if (error) throw error

      // Reset form and close dialog
      setGradeForm({
        student_id: '',
        course_id: selectedCourse || '',
        name: '',
        score: '',
        max_score: '',
        weight: '1',
        category: 'assignment',
        feedback: '',
        late: false,
        excused: false,
      })
      
      setIsAddGradeOpen(false)
    } catch (error: any) {
      console.error('Error adding grade:', error)
      alert(`Failed to add grade: ${error.message}`)
    }
  }

  const exportGrades = async () => {
    if (!selectedCourse) return

    try {
      // Fetch grades with student information
      const { data: gradesData, error } = await supabase
        .from('grades')
        .select(`
          *,
          students:users!student_id (id, name, email)
        `)
        .eq('course_id', selectedCourse)

      if (error) throw error

      // Format data as CSV
      const headers = ['Student Name', 'Student Email', 'Assignment', 'Category', 'Score', 'Max Score', 'Percentage', 'Grade']
      
      const csvRows = gradesData.map(grade => {
        const percentage = (grade.score / grade.max_score) * 100
        const letterGrade = calculateLetterGrade(percentage)
        
        return [
          `"${grade.students?.name || 'N/A'}"`,
          `"${grade.students?.email || 'N/A'}"`,
          `"${grade.name}"`,
          `"${grade.category}"`,
          grade.score,
          grade.max_score,
          `${percentage.toFixed(2)}%`,
          letterGrade
        ].join(',')
      })

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvRows
      ].join('\n')

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `grades_${selectedCourse}_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting grades:', error)
      alert('Failed to export grades')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grades</h1>
        <div className="flex space-x-2">
          {canManageGrades && (
            <Button onClick={() => setIsAddGradeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Grade
            </Button>
          )}
          <Button variant="outline" onClick={exportGrades}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Course selector */}
      <div className="flex items-center space-x-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[300px]">
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

      {/* Grade statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {user?.role === 'student' ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GPA</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gradeStats.gpa ? gradeStats.gpa.toFixed(2) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Current GPA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gradeStats.averageScore?.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {gradeStats.coursesEnrolled} courses
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gradeStats.coursesTeaching}</div>
                <p className="text-xs text-muted-foreground">
                  {gradeStats.totalStudents} total students
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Grades</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gradeStats.totalGrades}</div>
                <p className="text-xs text-muted-foreground">
                  {gradeStats.pendingGrades} pending review
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Grades table */}
      <Card>
        <CardHeader>
          <CardTitle>Grades</CardTitle>
          <CardDescription>
            {selectedCourse
              ? `Grades for ${courses.find(c => c.id === selectedCourse)?.name || 'selected course'}`
              : 'Select a course to view grades'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedCourse ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select a course to view grades
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No grades found for this course
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Assignment</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Score</th>
                    <th className="text-right p-2">Max Score</th>
                    <th className="text-right p-2">Percentage</th>
                    <th className="text-center p-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => {
                    const percentage = (grade.score / grade.max_score) * 100
                    const letterGrade = calculateLetterGrade(percentage)
                    
                    return (
                      <tr key={grade.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          {students.find(s => s.id === grade.student_id)?.name || 'Unknown'}
                        </td>
                        <td className="p-2">{grade.name}</td>
                        <td className="p-2">
                          <Badge variant="outline">{grade.category}</Badge>
                        </td>
                        <td className="p-2 text-right">{grade.score}</td>
                        <td className="p-2 text-right">{grade.max_score}</td>
                        <td className="p-2 text-right">
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={percentage >= 70 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}
                          >
                            {letterGrade}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Grade Dialog */}
      <Dialog open={isAddGradeOpen} onOpenChange={setIsAddGradeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Grade</DialogTitle>
            <DialogDescription>
              Enter the grade details below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="student" className="text-right">
                Student
              </Label>
              <Select
                value={gradeForm.student_id}
                onValueChange={(value) =>
                  setGradeForm({ ...gradeForm, student_id: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {courseStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Assignment
              </Label>
              <Input
                id="name"
                value={gradeForm.name}
                onChange={(e) =>
                  setGradeForm({ ...gradeForm, name: e.target.value })
                }
                className="col-span-3"
                placeholder="Assignment name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={gradeForm.category}
                onValueChange={(value) =>
                  setGradeForm({ ...gradeForm, category: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="participation">Participation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="score" className="text-right">
                Score
              </Label>
              <Input
                id="score"
                type="number"
                value={gradeForm.score}
                onChange={(e) =>
                  setGradeForm({ ...gradeForm, score: e.target.value })
                }
                className="col-span-1"
                placeholder="0"
              />
              <span className="text-center">/</span>
              <Input
                id="maxScore"
                type="number"
                value={gradeForm.max_score}
                onChange={(e) =>
                  setGradeForm({ ...gradeForm, max_score: e.target.value })
                }
                className="col-span-1"
                placeholder="100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={gradeForm.weight}
                onChange={(e) =>
                  setGradeForm({ ...gradeForm, weight: e.target.value })
                }
                className="col-span-3"
                placeholder="1.0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feedback" className="text-right">
                Feedback
              </Label>
              <Textarea
                id="feedback"
                value={gradeForm.feedback}
                onChange={(e) =>
                  setGradeForm({ ...gradeForm, feedback: e.target.value })
                }
                className="col-span-3"
                placeholder="Optional feedback"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="late"
                    checked={gradeForm.late}
                    onChange={(e) =>
                      setGradeForm({ ...gradeForm, late: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="late">Late Submission</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="excused"
                    checked={gradeForm.excused}
                    onChange={(e) =>
                      setGradeForm({ ...gradeForm, excused: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="excused">Excused</Label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddGradeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGrade}>Save Grade</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
