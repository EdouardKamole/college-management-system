"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FileText, Download, Eye, Shield } from "lucide-react"
import { calculateGPA, calculateSemesterGPA, getAcademicStanding } from "@/lib/grade-utils"
import type { User, Course, Grade, CourseGrade, GradeScale, Transcript } from "@/lib/data"

interface TranscriptGeneratorProps {
  students: User[]
  courses: Course[]
  grades: Grade[]
  courseGrades: CourseGrade[]
  gradeScale: GradeScale
  currentUser: User | null
  onGenerateTranscript: (transcript: Transcript) => void
}

export function TranscriptGenerator({
  students,
  courses,
  grades,
  courseGrades,
  gradeScale,
  currentUser,
  onGenerateTranscript,
}: TranscriptGeneratorProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTranscript, setPreviewTranscript] = useState<Transcript | null>(null)

  const canGenerateForOthers = currentUser?.role === "admin" || currentUser?.role === "instructor"

  const generateTranscript = (studentId: string): Transcript => {
    const student = students.find((s) => s.id === studentId)
    if (!student) throw new Error("Student not found")

    const studentCourseGrades = courseGrades.filter((cg) => cg.studentId === studentId)

    // Group by semester and year
    const semesterMap = new Map<string, CourseGrade[]>()
    studentCourseGrades.forEach((cg) => {
      const key = `${cg.semester}-${cg.year}`
      if (!semesterMap.has(key)) {
        semesterMap.set(key, [])
      }
      semesterMap.get(key)!.push(cg)
    })

    // Calculate semester data
    const semesters = Array.from(semesterMap.entries())
      .map(([key, courses]) => {
        const [semester, year] = key.split("-")
        const semesterGPA = calculateSemesterGPA(courses, semester, Number.parseInt(year))
        const semesterCredits = courses.reduce((sum, c) => sum + c.credits, 0)

        return {
          semester,
          year: Number.parseInt(year),
          courses: courses.sort((a, b) => {
            const courseA = courses.find((c) => c.id === a.courseId)
            const courseB = courses.find((c) => c.id === b.courseId)
            return (courseA?.name || "").localeCompare(courseB?.name || "")
          }),
          semesterGPA,
          semesterCredits,
        }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        const semesterOrder = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 }
        return (
          (semesterOrder[a.semester as keyof typeof semesterOrder] || 0) -
          (semesterOrder[b.semester as keyof typeof semesterOrder] || 0)
        )
      })

    const cumulativeGPA = calculateGPA(studentCourseGrades)
    const totalCredits = studentCourseGrades.reduce((sum, cg) => sum + cg.credits, 0)
    const academicStanding = getAcademicStanding(cumulativeGPA)

    const transcript: Transcript = {
      id: Date.now().toString(),
      studentId,
      generatedDate: new Date().toISOString(),
      generatedBy: currentUser?.id || "",
      semesters,
      cumulativeGPA,
      totalCredits,
      academicStanding,
    }

    return transcript
  }

  const handleGenerateTranscript = () => {
    if (!selectedStudent) return

    const transcript = generateTranscript(selectedStudent)
    onGenerateTranscript(transcript)
    setPreviewTranscript(transcript)
    setIsPreviewOpen(true)
  }

  const handlePreviewTranscript = () => {
    if (!selectedStudent) return

    const transcript = generateTranscript(selectedStudent)
    setPreviewTranscript(transcript)
    setIsPreviewOpen(true)
  }

  const downloadTranscript = (transcript: Transcript) => {
    const student = students.find((s) => s.id === transcript.studentId)
    if (!student) return

    const transcriptHTML = generateTranscriptHTML(transcript, student, courses)
    const blob = new Blob([transcriptHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${student.name.replace(/\s+/g, "_")}_transcript.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateTranscriptHTML = (transcript: Transcript, student: User, courses: Course[]): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Official Transcript - ${student.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .institution { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .transcript-title { font-size: 18px; font-weight: bold; }
        .student-info { margin-bottom: 30px; }
        .semester { margin-bottom: 25px; }
        .semester-header { background-color: #f5f5f5; padding: 10px; font-weight: bold; border: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f9f9f9; font-weight: bold; }
        .summary { margin-top: 30px; border-top: 2px solid #000; padding-top: 20px; }
        .gpa { font-size: 18px; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="institution">UGANDA AIR FORCE COLLEGE</div>
        <div>Official Academic Transcript</div>
        <div class="transcript-title">CONFIDENTIAL DOCUMENT</div>
    </div>

    <div class="student-info">
        <table>
            <tr><td><strong>Student Name:</strong></td><td>${student.name}</td></tr>
            <tr><td><strong>Student ID:</strong></td><td>${student.id}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${student.email}</td></tr>
            <tr><td><strong>Transcript Date:</strong></td><td>${new Date(transcript.generatedDate).toLocaleDateString()}</td></tr>
        </table>
    </div>

    ${transcript.semesters
      .map(
        (semester) => `
        <div class="semester">
            <div class="semester-header">${semester.semester} ${semester.year}</div>
            <table>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Credits</th>
                        <th>Grade</th>
                        <th>GPA Points</th>
                    </tr>
                </thead>
                <tbody>
                    ${semester.courses
                      .map((courseGrade) => {
                        const course = courses.find((c) => c.id === courseGrade.courseId)
                        return `
                            <tr>
                                <td>${course?.name || "Unknown Course"}</td>
                                <td>${courseGrade.credits}</td>
                                <td>${courseGrade.finalLetterGrade || courseGrade.letterGrade}</td>
                                <td>${courseGrade.gpa.toFixed(2)}</td>
                            </tr>
                        `
                      })
                      .join("")}
                </tbody>
            </table>
            <div style="text-align: right; margin-top: 10px;">
                <strong>Semester GPA: ${semester.semesterGPA.toFixed(2)} | Credits: ${semester.semesterCredits}</strong>
            </div>
        </div>
    `,
      )
      .join("")}

    <div class="summary">
        <table>
            <tr><td><strong>Total Credits Earned:</strong></td><td>${transcript.totalCredits}</td></tr>
            <tr><td><strong>Cumulative GPA:</strong></td><td class="gpa">${transcript.cumulativeGPA.toFixed(2)}</td></tr>
            <tr><td><strong>Academic Standing:</strong></td><td>${transcript.academicStanding}</td></tr>
        </table>
    </div>

    <div class="footer">
        <p>This is an official transcript issued by Uganda Air Force College.</p>
        <p>Generated on ${new Date(transcript.generatedDate).toLocaleDateString()} by authorized personnel.</p>
        <p><strong>CONFIDENTIAL - NOT VALID WITHOUT OFFICIAL SEAL</strong></p>
    </div>
</body>
</html>
    `
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Official Transcript Generator</span>
          </CardTitle>
          <CardDescription>Generate official academic transcripts for students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="student-select">Select Student:</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {(canGenerateForOthers ? students : students.filter((s) => s.id === currentUser?.id)).map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handlePreviewTranscript}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleGenerateTranscript}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Official Transcript
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Official Academic Transcript</span>
            </DialogTitle>
          </DialogHeader>

          {previewTranscript && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 border-gray-800 pb-4">
                <h1 className="text-2xl font-bold">UGANDA AIR FORCE COLLEGE</h1>
                <p className="text-lg">Official Academic Transcript</p>
                <p className="text-sm font-semibold text-red-600">CONFIDENTIAL DOCUMENT</p>
              </div>

              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Student Name:</strong> {students.find((s) => s.id === previewTranscript.studentId)?.name}
                    </div>
                    <div>
                      <strong>Student ID:</strong> {previewTranscript.studentId}
                    </div>
                    <div>
                      <strong>Email:</strong> {students.find((s) => s.id === previewTranscript.studentId)?.email}
                    </div>
                    <div>
                      <strong>Transcript Date:</strong> {new Date(previewTranscript.generatedDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Record */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Academic Record</h3>
                {previewTranscript.semesters.map((semester, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {semester.semester} {semester.year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 p-2 text-left">Course</th>
                              <th className="border border-gray-300 p-2 text-center">Credits</th>
                              <th className="border border-gray-300 p-2 text-center">Grade</th>
                              <th className="border border-gray-300 p-2 text-center">GPA Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semester.courses.map((courseGrade, courseIndex) => {
                              const course = courses.find((c) => c.id === courseGrade.courseId)
                              return (
                                <tr key={courseIndex}>
                                  <td className="border border-gray-300 p-2">{course?.name || "Unknown Course"}</td>
                                  <td className="border border-gray-300 p-2 text-center">{courseGrade.credits}</td>
                                  <td className="border border-gray-300 p-2 text-center">
                                    <Badge
                                      variant={
                                        (courseGrade.finalLetterGrade || courseGrade.letterGrade).startsWith("A")
                                          ? "default"
                                          : (courseGrade.finalLetterGrade || courseGrade.letterGrade).startsWith("B")
                                            ? "secondary"
                                            : "destructive"
                                      }
                                    >
                                      {courseGrade.finalLetterGrade || courseGrade.letterGrade}
                                    </Badge>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center">
                                    {courseGrade.gpa.toFixed(2)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 text-right">
                        <strong>
                          Semester GPA: {semester.semesterGPA.toFixed(2)} | Credits: {semester.semesterCredits}
                        </strong>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Summary */}
              <Card className="border-2 border-gray-800">
                <CardHeader>
                  <CardTitle>Academic Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{previewTranscript.totalCredits}</div>
                      <p className="text-sm text-muted-foreground">Total Credits</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {previewTranscript.cumulativeGPA.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Cumulative GPA</p>
                    </div>
                    <div>
                      <Badge variant="default" className="text-sm">
                        {previewTranscript.academicStanding}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">Academic Standing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground border-t pt-4">
                <p>This is an official transcript issued by Uganda Air Force College.</p>
                <p>
                  Generated on {new Date(previewTranscript.generatedDate).toLocaleDateString()} by authorized personnel.
                </p>
                <p className="font-semibold text-red-600">CONFIDENTIAL - NOT VALID WITHOUT OFFICIAL SEAL</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => downloadTranscript(previewTranscript)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download HTML
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
