"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2 } from "lucide-react"
import { calculateCourseGrade, calculateLetterGrade } from "@/lib/grade-utils"
import type { Grade, GradeCategory, GradeScale, User } from "@/lib/data"

interface GradeBookProps {
  courseId: string
  grades: Grade[]
  categories: GradeCategory[]
  students: User[]
  gradeScale: GradeScale
  onUpdateGrade: (gradeId: string, updates: Partial<Grade>) => void
  onDeleteGrade: (gradeId: string) => void
}

export function GradeBook({
  courseId,
  grades,
  categories,
  students,
  gradeScale,
  onUpdateGrade,
  onDeleteGrade,
}: GradeBookProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const courseGrades = grades.filter((g) => g.courseId === courseId)
  const courseCategories = categories.filter((c) => c.courseId === courseId)
  const enrolledStudents = students.filter((s) => s.role === "student")

  // Get unique assignments
  const assignments = useMemo(() => {
    const uniqueAssignments = new Map()
    courseGrades.forEach((grade) => {
      const key = `${grade.category}-${grade.name}`
      if (!uniqueAssignments.has(key)) {
        uniqueAssignments.set(key, {
          category: grade.category,
          name: grade.name,
          maxScore: grade.maxScore,
          weight: grade.weight,
        })
      }
    })
    return Array.from(uniqueAssignments.values())
  }, [courseGrades])

  // Calculate student grades
  const studentGrades = useMemo(() => {
    return enrolledStudents.map((student) => {
      const studentCourseGrades = courseGrades.filter((g) => g.studentId === student.id)
      const { percentage } = calculateCourseGrade(studentCourseGrades, courseCategories, courseId)
      const { letter, gpa } = calculateLetterGrade(percentage, gradeScale)

      return {
        student,
        grades: studentCourseGrades,
        currentGrade: percentage,
        letterGrade: letter,
        gpa,
      }
    })
  }, [enrolledStudents, courseGrades, courseCategories, courseId, gradeScale])

  const handleEditGrade = (grade: Grade) => {
    setEditingGrade(grade)
    setIsEditDialogOpen(true)
  }

  const handleUpdateGrade = () => {
    if (!editingGrade) return

    onUpdateGrade(editingGrade.id, editingGrade)
    setIsEditDialogOpen(false)
    setEditingGrade(null)
  }

  const getGradeForAssignment = (studentId: string, category: string, name: string) => {
    return courseGrades.find((g) => g.studentId === studentId && g.category === category && g.name === name)
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Grade Book - List View</h3>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setViewMode("grid")}>
              Grid View
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {studentGrades.map(({ student, grades: studentCourseGrades, currentGrade, letterGrade }) => (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{student.name}</h4>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{currentGrade.toFixed(1)}%</div>
                    <Badge variant={currentGrade >= 90 ? "default" : currentGrade >= 80 ? "secondary" : "destructive"}>
                      {letterGrade}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {studentCourseGrades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{grade.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {grade.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(grade.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {grade.score}/{grade.maxScore}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({((grade.score / grade.maxScore) * 100).toFixed(1)}%)
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => handleEditGrade(grade)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteGrade(grade.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Grade Book - Grid View</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setViewMode("list")}>
            List View
          </Button>
        </div>
      </div>

      {/* Grade Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-medium">Student</th>
              {assignments.map((assignment, index) => (
                <th
                  key={index}
                  className="border border-gray-300 dark:border-gray-600 p-3 text-center font-medium min-w-[120px]"
                >
                  <div>
                    <div className="font-medium">{assignment.name}</div>
                    <div className="text-xs text-muted-foreground">{assignment.category}</div>
                    <div className="text-xs text-muted-foreground">/{assignment.maxScore}</div>
                  </div>
                </th>
              ))}
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-center font-medium">Current Grade</th>
            </tr>
          </thead>
          <tbody>
            {studentGrades.map(({ student, currentGrade, letterGrade }) => (
              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">{student.email}</div>
                  </div>
                </td>
                {assignments.map((assignment, index) => {
                  const grade = getGradeForAssignment(student.id, assignment.category, assignment.name)
                  return (
                    <td key={index} className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                      {grade ? (
                        <div className="group relative">
                          <div className="font-medium">{grade.score}</div>
                          <div className="text-xs text-muted-foreground">
                            {((grade.score / grade.maxScore) * 100).toFixed(0)}%
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditGrade(grade)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteGrade(grade.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">-</div>
                      )}
                    </td>
                  )
                })}
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-center">
                  <div>
                    <div className="font-bold">{currentGrade.toFixed(1)}%</div>
                    <Badge
                      variant={currentGrade >= 90 ? "default" : currentGrade >= 80 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {letterGrade}
                    </Badge>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Class Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Class Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">
                {studentGrades.length > 0
                  ? (studentGrades.reduce((sum, s) => sum + s.currentGrade, 0) / studentGrades.length).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-sm text-muted-foreground">Class Average</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {studentGrades.length > 0 ? Math.max(...studentGrades.map((s) => s.currentGrade)).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Highest Grade</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {studentGrades.length > 0 ? Math.min(...studentGrades.map((s) => s.currentGrade)).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Lowest Grade</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{studentGrades.filter((s) => s.currentGrade >= 90).length}</div>
              <p className="text-sm text-muted-foreground">A Grades</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Grade Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
          </DialogHeader>
          {editingGrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-score">Score</Label>
                  <Input
                    id="edit-score"
                    type="number"
                    value={editingGrade.score}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        score: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-maxScore">Max Score</Label>
                  <Input
                    id="edit-maxScore"
                    type="number"
                    value={editingGrade.maxScore}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        maxScore: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-feedback">Feedback</Label>
                <Textarea
                  id="edit-feedback"
                  value={editingGrade.feedback || ""}
                  onChange={(e) =>
                    setEditingGrade({
                      ...editingGrade,
                      feedback: e.target.value,
                    })
                  }
                  placeholder="Provide feedback..."
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-late"
                    checked={editingGrade.late || false}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        late: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="edit-late">Late Submission</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-excused"
                    checked={editingGrade.excused || false}
                    onChange={(e) =>
                      setEditingGrade({
                        ...editingGrade,
                        excused: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="edit-excused">Excused</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateGrade}>Update Grade</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
