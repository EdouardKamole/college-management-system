"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BarChart3, Clock, User, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import type { Exam, ExamSubmission, User as UserType } from "@/lib/data"

interface ExamResultsProps {
  exam: Exam
  submissions: ExamSubmission[]
  currentUser: UserType | null
  onClose: () => void
}

export function ExamResults({ exam, submissions, currentUser, onClose }: ExamResultsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(userSubmission || null)
  const [gradingScores, setGradingScores] = useState<{ [questionId: string]: number }>({})
  const [gradingFeedback, setGradingFeedback] = useState<{ [questionId: string]: string }>({})

  const isInstructor = currentUser?.role === "admin" || currentUser?.role === "instructor"
  const userSubmission = submissions.find((s) => 
    s && s.studentid && currentUser?.id && s.studentid.toString() === currentUser.id.toString()
  )

  const calculateStats = () => {
    const completedSubmissions = submissions.filter(
      (s) => s && s.status === "graded" && s.score !== undefined && s.maxscore && s.maxscore > 0
    )
    
    if (completedSubmissions.length === 0) return null

    const scores = completedSubmissions.map((s) => {
      const score = s.score || 0;
      const maxScore = s.maxscore || 1; // Prevent division by zero
      return (score / maxScore) * 100;
    });
    
    const average = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      totalSubmissions: submissions.length,
      completedSubmissions: completedSubmissions.length,
      average: Math.round(average * 100) / 100,
      highest: Math.round(highest * 100) / 100,
      lowest: Math.round(lowest * 100) / 100,
    }
  }

  const stats = calculateStats()

  const renderQuestionResult = (question: any, index: number, submission: ExamSubmission) => {
    // Find the answer for this question in the submission
    const answerObj = Array.isArray(submission.answers) 
      ? submission.answers.find((a: any) => a.questionId === question.id)
      : null;
    const answer = answerObj?.answer;
    // Handle both string and number correct answers
    const correctAnswer = question.correctAnswer?.toString() || '';
    const studentAnswer = answer?.toString() || '';
    
    const isCorrect = correctAnswer && studentAnswer 
      ? correctAnswer.toLowerCase() === studentAnswer.toLowerCase()
      : false;
      
    const needsGrading = (question.type === "short-answer" || question.type === "essay") && 
      submission.status === "submitted" && 
      (!questionAnswer || questionAnswer.score === undefined);

    return (
      <Card key={question.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{question.points} points</Badge>
              {question.correctAnswer !== undefined && (
                <Badge variant={isCorrect ? "default" : "destructive"}>
                  {isCorrect ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                  {isCorrect ? "Correct" : "Incorrect"}
                </Badge>
              )}
              {needsGrading && (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Needs Grading
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Question:</h4>
            <p className="text-sm">{question.question}</p>
          </div>

          {question.type === "multiple-choice" && (
            <div>
              <h4 className="font-medium mb-2">Options:</h4>
              <div className="space-y-1">
                {question.options?.map((option: string, optionIndex: number) => (
                  <div
                    key={optionIndex}
                    className={`p-2 rounded text-sm ${
                      optionIndex === question.correctAnswer
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : optionIndex === answer
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    {option}
                    {optionIndex === question.correctAnswer && " ✓ (Correct)"}
                    {optionIndex === answer && optionIndex !== question.correctAnswer && " ✗ (Your answer)"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(question.type === "short-answer" || question.type === "essay") && (
            <div>
              <h4 className="font-medium mb-2">Student Answer:</h4>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-sm whitespace-pre-wrap">{answer || "No answer provided"}</p>
              </div>

              {isInstructor && needsGrading && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <Label htmlFor={`score-${question.id}`}>Score (out of {question.points})</Label>
                    <Input
                      id={`score-${question.id}`}
                      type="number"
                      min="0"
                      max={question.points}
                      value={gradingScores[question.id] || ""}
                      onChange={(e) =>
                        setGradingScores((prev) => ({
                          ...prev,
                          [question.id]: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`feedback-${question.id}`}>Feedback (Optional)</Label>
                    <Textarea
                      id={`feedback-${question.id}`}
                      value={gradingFeedback[question.id] || ""}
                      onChange={(e) =>
                        setGradingFeedback((prev) => ({
                          ...prev,
                          [question.id]: e.target.value,
                        }))
                      }
                      placeholder="Provide feedback for this answer..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={isInstructor ? "overview" : "results"}>
        <TabsList>
          {isInstructor && <TabsTrigger value="overview">Overview</TabsTrigger>}
          <TabsTrigger value="results">{isInstructor ? "Individual Results" : "My Results"}</TabsTrigger>
          {isInstructor && <TabsTrigger value="submissions">All Submissions</TabsTrigger>}
        </TabsList>

        {isInstructor && (
          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Graded</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedSubmissions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.average}%</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.highest}%</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.lowest}%</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Exam Summary</CardTitle>
                <CardDescription>{exam.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Questions:</span> {exam.questions.length}
                  </div>
                  <div>
                    <span className="font-medium">Total Points:</span> {exam.totalpoints}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {exam.duration} minutes
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(exam.date).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="results" className="space-y-6">
          {isInstructor ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="submission-select">Select Student Submission:</Label>
                <select
                  id="submission-select"
                  className="w-full mt-1 p-2 border rounded-md"
                  value={selectedSubmission?.id || ""}
                  onChange={(e) => {
                    const submission = submissions.find((s) => s.id === e.target.value)
                    setSelectedSubmission(submission || null)
                  }}
                >
                  <option value="">Select a submission...</option>
                  {submissions.map((submission) => (
                    <option key={submission.id} value={submission.id}>
                      Student {submission.studentid} - {submission.status}
                      {submission.score !== undefined &&
                        ` (${Math.round((submission.score / submission.maxscore) * 100)}%)`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubmission && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Student ID:</span> {selectedSubmission.studentid}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <Badge
                            className="ml-2"
                            variant={selectedSubmission.status === "graded" ? "default" : "secondary"}
                          >
                            {selectedSubmission.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Start Time:</span>{" "}
                          {new Date(selectedSubmission.starttime).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Submit Time:</span>{" "}
                          {selectedSubmission.submittime
                            ? new Date(selectedSubmission.submittime).toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Time Spent:</span>{" "}
                          {Math.round(selectedSubmission.timespent / 60)} minutes
                        </div>
                        {selectedSubmission.score !== undefined && (
                          <div>
                            <span className="font-medium">Score:</span> {selectedSubmission.score}/
                            {selectedSubmission.maxscore} (
                            {Math.round((selectedSubmission.score / selectedSubmission.maxscore) * 100)}%)
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    {exam.questions.map((question, index) => renderQuestionResult(question, index, selectedSubmission))}
                  </div>

                  {selectedSubmission.status === "submitted" && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          // Handle grading submission
                          const totalScore = Object.values(gradingScores).reduce((sum, score) => sum + score, 0)
                          // Update submission with grades - this would typically call an API
                          console.log("Grading submission:", { totalScore, feedback: gradingFeedback })
                        }}
                      >
                        Save Grades
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : userSubmission ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Results</CardTitle>
                  <CardDescription>{exam.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className="ml-2" variant={userSubmission.status === "graded" ? "default" : "secondary"}>
                        {userSubmission.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Submitted:</span>{" "}
                      {userSubmission.submittime ? new Date(userSubmission.submittime).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Time Spent:</span> {Math.round(userSubmission.timespent / 60)}{" "}
                      minutes
                    </div>
                    {userSubmission.score !== undefined && (
                      <div>
                        <span className="font-medium">Score:</span> {userSubmission.score}/{userSubmission.maxscore} (
                        {Math.round((userSubmission.score / userSubmission.maxscore) * 100)}%)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {exam.showresults && (
                <div className="space-y-4">
                  {exam.questions.map((question, index) => renderQuestionResult(question, index, userSubmission))}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No submission found for this exam.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isInstructor && (
          <TabsContent value="submissions" className="space-y-4">
            <div className="grid gap-4">
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Student {submission.studentid}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                          {submission.status}
                        </Badge>
                        {submission.score !== undefined && (
                          <Badge variant="outline">{Math.round((submission.score / submission.maxscore) * 100)}%</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {Math.round(submission.timespent / 60)} minutes
                      </div>
                      <div>
                        Submitted:{" "}
                        {submission.submittime ? new Date(submission.submittime).toLocaleString() : "In progress"}
                      </div>
                      <div className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
