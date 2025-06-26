"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExamCreator } from "@/components/exam-creator"
import { ExamTaker } from "@/components/exam-taker"
import { ExamResults } from "@/components/exam-results"
import { Plus, Clock, FileText, Edit, Trash2, Play, BarChart3, Calendar } from "lucide-react"
import type { Exam, ExamSubmission } from "@/lib/data"

// Loading skeleton component for exam cards
function ExamSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex items-center space-x-4 pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function Exams() {
  // Get user and data from hooks
  const { user } = useAuth()
  const {
    data,
    loading,
    addExam,
    updateExam,
    deleteExam,
    addExamSubmission,
    updateExamSubmission,
    deleteExamSubmission,
  } = useSupabaseData()
  
  // State management with explicit types
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [isCreatorOpen, setIsCreatorOpen] = useState<boolean>(false)
  const [isTakerOpen, setIsTakerOpen] = useState<boolean>(false)
  const [isResultsOpen, setIsResultsOpen] = useState<boolean>(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  
  // Helper variables
  const canManageExams = user?.role === "admin" || user?.role === "instructor"

  // Filter exams based on user role
  const userExams = data.exams.filter((currentExam) => {
    const course = data.courses.find((c) => c.id === currentExam.courseid)
    if (!course) return false

    if (user?.role === "admin") return true
    if (user?.role === "instructor") return course.instructorid === user.id
    if (user?.role === "student") return Array.isArray(course.studentids) && course.studentids.includes(user.id)
    return false
  })

  const getExamSubmission = (examId: string): ExamSubmission | undefined => {
    return data.examSubmissions?.find((submission: ExamSubmission) => 
      submission.examid === examId && submission.studentid === user?.id
    )
  }

  const getExamStats = (currentExam: Exam) => {
    const examSubmissions = (data.examSubmissions || []).filter((s: ExamSubmission) => s.examid === currentExam.id);
    const completedExamSubmissions = examSubmissions.filter((s: ExamSubmission) => 
      s.status === "submitted" || s.status === "graded"
    );
    
    // Calculate average score based on marksawarded if available
    const totalMarks = completedExamSubmissions.reduce((sum: number, s: ExamSubmission) => {
      return sum + (s.marksawarded || 0);
    }, 0);
    
    const averageScoreValue = completedExamSubmissions.length > 0 
      ? totalMarks / completedExamSubmissions.length 
      : 0;
    
    return {
      totalSubmissions: examSubmissions.length,
      completedSubmissions: completedExamSubmissions.length,
      averageScore: Math.round(averageScoreValue * 100) / 100,
      course: data.courses.find((c) => c.id === currentExam.courseid),
    };
  }

  const handleCreateExam = (): void => {
    setEditingExam(null);
    setIsCreatorOpen(true);
  }

  const handleEditExam = (exam: Exam): void => {
    setEditingExam(exam);
    setIsCreatorOpen(true);
  }

  const handleDeleteExam = async (examId: string): Promise<void> => {
    if (!deleteExam) {
      console.error('Delete exam function is not available');
      return;
    }
    
    try {
      await deleteExam(examId);
    } catch (err) {
      console.error('Error deleting exam:', err);
    }
  }

  const handleTakeExam = (exam: Exam): void => {
    setSelectedExam(exam);
    setIsTakerOpen(true);
  }

  const handleViewResults = (exam: Exam): void => {
    setSelectedExam(exam);
    setIsResultsOpen(true);
  }

  const getExamStatus = (exam: Exam): string => {
    const now = new Date();
    
    // Create date strings in YYYY-MM-DD format for the exam date
    const examDateStr = exam.date;
    
    // Create date objects with proper timezone handling
    const examStart = new Date(`${examDateStr}T${exam.starttime}`);
    const examEnd = new Date(`${examDateStr}T${exam.endtime}`);
    
    // If end time is earlier than start time, it means the exam ends the next day
    if (examEnd <= examStart) {
      examEnd.setDate(examEnd.getDate() + 1);
    }
    
    if (now < examStart) return "upcoming";
    if (now > examEnd) return "completed";
    return "active";
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

  // Show loading skeleton while data is being fetched
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          {canManageExams && <Skeleton className="h-9 w-32" />}
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <Skeleton className="h-9 w-24 mx-1" />
            <Skeleton className="h-9 w-24 mx-1" />
            {canManageExams && <Skeleton className="h-9 w-24 mx-1" />}
          </TabsList>
          <TabsContent value="overview">
            <ExamSkeleton />
          </TabsContent>
        </Tabs>
      </div>
    )
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

      <Tabs 
        value={activeTab} 
        onValueChange={(value: string) => setActiveTab(value)} 
        className="space-y-4"
      >
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
                      {data.examSubmissions.filter((s) => s.studentid === user.id && s.status !== "in-progress").length}
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
                          (s) => s.studentid === user.id && s.status === "graded" && s.score !== undefined,
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
                        {new Date(exam.date).toLocaleDateString()} at {exam.starttime}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {exam.duration} minutes • {exam.totalpoints} points
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
                                <div className="text-right">
                                  <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                                    {submission.status}
                                  </Badge>
                                  {submission.marksawarded !== undefined && (
                                    <div className="text-lg font-bold mt-1">
                                      {submission.marksawarded}%
                                    </div>
                                  )}
                                </div>
                              </div>
                              {submission.score !== undefined && submission.maxscore !== undefined && (
                                <div className="flex justify-between text-sm">
                                  <span>Score:</span>
                                  <span className="font-medium">
                                    {Math.round((submission.score / submission.maxscore) * 100)}%
                                  </span>
                                </div>
                              )}
                              <Button
                                variant="outline"
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
                {data.examSubmissions
                  .filter((submission) => submission.studentid === user?.id && submission.status !== "in-progress")
                  .map((submission) => {
                    const exam = data.exams.find((e) => e.id === submission.examid);
                    const course = exam ? data.courses.find((c) => c.id === exam.courseid) : null;
                    if (!exam || !course) return null;

                    return (
                      <Card key={submission.id}>
                        <CardHeader>
                          <CardTitle>{exam.name}</CardTitle>
                          <CardDescription>{course?.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">{exam?.description || 'No description available'}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span>Duration: {exam?.duration || 0} minutes</span>
                              <span>Points: {exam?.totalpoints || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Questions: {exam?.questions?.length || 0}</span>
                              <span>Attempts: {exam?.attempts || 0}</span>
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
                  .filter((submission) => submission.studentid === user?.id && submission.status !== "in-progress")
                  .map((submission) => {
                    const exam = data.exams.find((e) => e.id === submission.examid);
                    const course = exam ? data.courses.find((c) => c.id === exam.courseid) : null;
                    if (!exam || !course) return null;

                    return (
                      <Card key={submission.id}>
                        <CardHeader>
                          <CardTitle>{exam.name}</CardTitle>
                          <CardDescription>{course?.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">{exam?.description || 'No description available'}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span>Duration: {exam?.duration || 0} minutes</span>
                              <span>Points: {exam?.totalpoints || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Questions: {exam?.questions?.length || 0}</span>
                              <span>Attempts: {exam?.attempts || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-muted-foreground">
                                Submitted: {new Date(submission.submissiondate).toLocaleString()}
                              </div>
                              <Button variant="outline" onClick={() => handleViewResults(exam)}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
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
            <DialogTitle>{editingExam ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
            <DialogDescription>
              {editingExam ? 'Update the exam details below' : 'Fill in the details to create a new exam'}
            </DialogDescription>
          </DialogHeader>
          <ExamCreator
            exam={editingExam}
            onSave={(exam) => {
              if (editingExam && updateExam) {
                updateExam(editingExam.id, exam);
              } else if (addExam) {
                addExam(exam);
              }
              setIsCreatorOpen(false);
              setEditingExam(null);
            }}
            onCancel={() => {
              setIsCreatorOpen(false);
              setEditingExam(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Exam Taker Dialog */}
      {selectedExam && (
        <Dialog 
          open={isTakerOpen} 
          onOpenChange={(open) => setIsTakerOpen(open)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedExam.name}</DialogTitle>
              <DialogDescription>Complete your examination</DialogDescription>
            </DialogHeader>
            <ExamTaker
              exam={selectedExam}
              onSubmit={(submission: ExamSubmission) => {
                if (addExamSubmission) {
                  addExamSubmission(submission);
                }
                setIsTakerOpen(false);
              }}
              onCancel={() => setIsTakerOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Exam Results Dialog */}
      <Dialog open={isResultsOpen} onOpenChange={(open) => setIsResultsOpen(open)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.name} - Results</DialogTitle>
            <DialogDescription>Examination results and analytics</DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <ExamResults
              exam={selectedExam}
              submissions={data.examSubmissions.filter((s) => s.examid === selectedExam.id)}
              currentUser={user}
              onClose={() => setIsResultsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
