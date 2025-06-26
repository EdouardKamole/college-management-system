"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExamCreator } from "@/components/exam-creator"
import { ExamTaker } from "@/components/exam-taker"
import { ExamResults } from "@/components/exam-results"
import { Plus, Clock, FileText, Edit, Trash2, Play, BarChart3, Calendar } from "lucide-react"
import type { Exam, ExamSubmission } from "@/lib/data"

export function Exams() {
  const { user } = useAuth()
  const {
    data,
    addExam,
    updateExam,
    deleteExam,
    addExamSubmission,
    updateExamSubmission,
    deleteExamSubmission,
  } = useSupabaseData()
  const [activeTab, setActiveTab] = useState("overview")
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)
  const [isTakerOpen, setIsTakerOpen] = useState(false)
  const [isResultsOpen, setIsResultsOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)

  const canManageExams = user?.role === "admin" || user?.role === "instructor"

  // Filter exams based on user role
  const userExams = data.exams.filter((exam) => {
    const course = data.courses.find((c) => c.id === exam.courseId)
    if (!course) return false

    if (user?.role === "admin") return true
    if (user?.role === "instructor") return course.instructorId === user.id
    if (user?.role === "student") return course.studentIds.includes(user.id)
    return false
  })

  const getExamSubmission = (examId: string): ExamSubmission | undefined => {
    return data.examSubmissions.find((submission) => submission.examId === examId && submission.studentId === user?.id)
  }

  const getExamStats = (exam: Exam) => {
    const submissions = data.examSubmissions.filter((s) => s.examId === exam.id)
    const completedSubmissions = submissions.filter((s) => s.status === "submitted" || s.status === "graded")
    const averageScore =
      completedSubmissions.length > 0
        ? completedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSubmissions.length
        : 0

    return {
      totalSubmissions: submissions.length,
      completedSubmissions: completedSubmissions.length,
      averageScore: Math.round(averageScore * 100) / 100,
      course: data.courses.find((c) => c.id === exam.courseId),
    }
  }

  const handleCreateExam = () => {
    setEditingExam(null)
    setIsCreatorOpen(true)
  }

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam)
    setIsCreatorOpen(true)
  }

  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExam(examId)
    } catch (err) {
      console.error(err)
    }
  }

  const handleTakeExam = (exam: Exam) => {
    setSelectedExam(exam)
    setIsTakerOpen(true)
  }

  const handleViewResults = (exam: Exam) => {
    setSelectedExam(exam)
    setIsResultsOpen(true)
  }

  const getExamStatus = (exam: Exam) => {
    const now = new Date()
    const examDate = new Date(`${exam.date} ${exam.startTime}`)
    const examEndDate = new Date(`${exam.date} ${exam.endTime}`)

    if (now < examDate) return "upcoming"
    if (now > examEndDate) return "completed"
    return "active"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>
      case "active":
        return <Badge variant="default">Active</Badge>
      case "completed":
        return <Badge variant="outline">Completed</Badge>
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "published":
        return <Badge variant="default">Published</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Examination Management</h1>
          <p className="text-muted-foreground">
            {canManageExams ? "Create and manage examinations" : "View and take your exams"}
          </p>
        </div>
        {canManageExams && (
          <Button onClick={handleCreateExam}>
            <Plus className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {user?.role === "student" && <TabsTrigger value="available">Available Exams</TabsTrigger>}
          {user?.role === "student" && <TabsTrigger value="completed">My Results</TabsTrigger>}
          {canManageExams && <TabsTrigger value="manage">Manage Exams</TabsTrigger>}
          {canManageExams && <TabsTrigger value="submissions">Submissions</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userExams.length}</div>
                <p className="text-xs text-muted-foreground">{canManageExams ? "Created exams" : "Available exams"}</p>
              </CardContent>
            </Card>

            {user?.role === "student" && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {data.examSubmissions.filter((s) => s.studentId === user.id && s.status !== "in-progress").length}
                    </div>
                    <p className="text-xs text-muted-foreground">Submitted exams</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const gradedSubmissions = data.examSubmissions.filter(
                          (s) => s.studentId === user.id && s.status === "graded" && s.score !== undefined,
                        )
                        if (gradedSubmissions.length === 0) return "N/A"
                        const avg =
                          gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
                        return `${Math.round(avg)}%`
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">Overall performance</p>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userExams.filter((exam) => getExamStatus(exam) === "upcoming").length}
                </div>
                <p className="text-xs text-muted-foreground">Scheduled exams</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userExams.slice(0, 6).map((exam) => {
              const stats = getExamStats(exam)
              const submission = user?.role === "student" ? getExamSubmission(exam.id) : null
              const status = getExamStatus(exam)

              return (
                <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{exam.name}</CardTitle>
                        <CardDescription className="mt-1">{stats.course?.name}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(status)}
                        {exam.status === "draft" && getStatusBadge("draft")}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(exam.date).toLocaleDateString()} at {exam.startTime}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {exam.duration} minutes • {exam.totalPoints} points
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 mr-2" />
                        {exam.questions.length} questions
                      </div>

                      {user?.role === "student" && (
                        <div className="pt-2 border-t">
                          {submission ? (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Status:</span>
                                <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                                  {submission.status}
                                </Badge>
                              </div>
                              {submission.score !== undefined && (
                                <div className="flex justify-between text-sm">
                                  <span>Score:</span>
                                  <span className="font-medium">
                                    {Math.round((submission.score / submission.maxScore) * 100)}%
                                  </span>
                                </div>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleViewResults(exam)}
                              >
                                View Results
                              </Button>
                            </div>
                          ) : status === "active" ? (
                            <Button className="w-full" onClick={() => handleTakeExam(exam)}>
                              <Play className="h-4 w-4 mr-2" />
                              Take Exam
                            </Button>
                          ) : status === "upcoming" ? (
                            <Button variant="outline" className="w-full" disabled>
                              Exam Not Started
                            </Button>
                          ) : (
                            <Button variant="outline" className="w-full" disabled>
                              Exam Ended
                            </Button>
                          )}
                        </div>
                      )}

                      {canManageExams && (
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Submissions:</span>
                            <span>{stats.completedSubmissions}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditExam(exam)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleViewResults(exam)}>
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExam(exam.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {user?.role === "student" && (
          <>
            <TabsContent value="available" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userExams
                  .filter((exam) => !getExamSubmission(exam.id) && getExamStatus(exam) === "active")
                  .map((exam) => {
                    const course = data.courses.find((c) => c.id === exam.courseId)
                    return (
                      <Card key={exam.id}>
                        <CardHeader>
                          <CardTitle>{exam.name}</CardTitle>
                          <CardDescription>{course?.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">{exam.description}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span>Duration: {exam.duration} minutes</span>
                              <span>Points: {exam.totalPoints}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Questions: {exam.questions.length}</span>
                              <span>Attempts: {exam.attempts}</span>
                            </div>
                            <Button className="w-full" onClick={() => handleTakeExam(exam)}>
                              <Play className="h-4 w-4 mr-2" />
                              Start Exam
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <div className="space-y-4">
                {data.examSubmissions
                  .filter((submission) => submission.studentId === user.id && submission.status !== "in-progress")
                  .map((submission) => {
                    const exam = data.exams.find((e) => e.id === submission.examId)
                    const course = exam ? data.courses.find((c) => c.id === exam.courseId) : null
                    if (!exam || !course) return null

                    return (
                      <Card key={submission.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{exam.name}</CardTitle>
                              <CardDescription>{course.name}</CardDescription>
                            </div>
                            <div className="text-right">
                              <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                                {submission.status}
                              </Badge>
                              {submission.score !== undefined && (
                                <div className="text-lg font-bold mt-1">
                                  {Math.round((submission.score / submission.maxScore) * 100)}%
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              Submitted: {new Date(submission.submitTime || submission.startTime).toLocaleString()}
                            </div>
                            <Button variant="outline" onClick={() => handleViewResults(exam)}>
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Exam Creator Dialog */}
      <Dialog open={isCreatorOpen} onOpenChange={setIsCreatorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExam ? "Edit Exam" : "Create New Exam"}</DialogTitle>
            <DialogDescription>
              {editingExam ? "Update exam details and questions" : "Create a comprehensive examination"}
            </DialogDescription>
          </DialogHeader>
          <ExamCreator
            exam={editingExam}
            onSave={(exam) => {
              if (editingExam) {
                updateExam(exam)
              } else {
                addExam(exam)
              }
              setIsCreatorOpen(false)
            }}
            onCancel={() => setIsCreatorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Exam Taker Dialog */}
      <Dialog open={isTakerOpen} onOpenChange={setIsTakerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.name}</DialogTitle>
            <DialogDescription>Complete your examination</DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <ExamTaker
              exam={selectedExam}
              onSubmit={(submission) => {
                addExamSubmission(submission)
                setIsTakerOpen(false)
              }}
              onCancel={() => setIsTakerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Exam Results Dialog */}
      <Dialog open={isResultsOpen} onOpenChange={setIsResultsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.name} - Results</DialogTitle>
            <DialogDescription>Examination results and analytics</DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <ExamResults
              exam={selectedExam}
              submissions={data.examSubmissions.filter((s) => s.examId === selectedExam.id)}
              currentUser={user}
              onClose={() => setIsResultsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
