"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Send, AlertTriangle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Exam, ExamSubmission, Question } from "@/lib/data"

interface ExamTakerProps {
  exam: Exam
  onSubmit: (submission: ExamSubmission) => void
  onCancel: () => void
}

export function ExamTaker({ exam, onSubmit, onCancel }: ExamTakerProps) {
  // Early return if no exam or questions
  if (!exam || !exam.questions?.length) {
    return (
      <div className="p-6 text-center">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No questions available for this exam. Please contact your instructor.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  const { user } = useAuth()
  const [answers, setAnswers] = useState<{ [questionId: string]: string | number }>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60) // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const startTimeRef = useRef(new Date().toISOString())

  const questions = exam.randomizequestions ? [...exam.questions].sort(() => Math.random() - 0.5) : exam.questions

  const calculateScore = useCallback(() => {
    let score = 0;
    let maxScore = 0;

    if (!questions?.length) return { score: 0, maxScore: 0 };

    questions.forEach((question) => {
      const points = Number(question.points) || 0;
      maxScore += points;
      const answer = answers[question.id];

      if (answer !== undefined && answer !== null && answer !== '') {
        if (question.type === "multiple-choice" || question.type === "true-false") {
          // Handle both 'correctanswer' and 'correctAnswer' for backward compatibility
          const correctAnswer = 'correctAnswer' in question ? question.correctAnswer : question.correctanswer;
          if (answer === correctAnswer) {
            score += points;
          }
        }
      }
      // Short answer and essay questions need manual grading
    });

    return { score, maxScore };
  }, [questions, answers]);

  // Memoize handleSubmit to prevent unnecessary re-renders
  const handleSubmit = useCallback((isAutoSubmit = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const { score, maxScore } = calculateScore();
    const hasManualGrading = questions.some((q) => (q.type === "short-answer" || q.type === "essay") && answers[q.id]);

    // Convert answers to the format expected by the database
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: answer !== undefined ? answer : null,
      questionType: questions.find(q => q.id === questionId)?.type || 'unknown',
      submittedAt: new Date().toISOString()
    }));

    // Create a properly typed submission object with UUID
    const submission: ExamSubmission = {
      id: uuidv4(),
      examid: exam.id,
      studentid: user?.id || "",
      submissiondate: new Date().toISOString(),
      answers: formattedAnswers, // Array of { questionId, answer, questionType, submittedAt }
      starttime: startTimeRef.current,
      submittime: new Date().toISOString(),
      timespent: exam.duration * 60 - timeLeft,
      status: hasManualGrading ? "submitted" : "graded",
      score: hasManualGrading ? undefined : score,
      maxscore: exam.totalpoints,
      autograded: !hasManualGrading,
      fileurl: ""
    };

    onSubmit(submission);
  }, [isSubmitting, answers, timeLeft, exam, user, onSubmit, calculateScore]);

  // Memoize handleAutoSubmit to prevent unnecessary re-renders
  const handleAutoSubmit = useCallback(() => {
    if (isSubmitting) return;
    handleSubmit(true);
  }, [isSubmitting, handleSubmit]);

  // Handle timer effect
  useEffect(() => {
    if (!exam.questions?.length) {
      console.error('No questions found in exam');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [handleAutoSubmit, exam.questions?.length]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  // handleSubmit is now memoized and moved up with the other handlers

  const getAnsweredCount = () => {
    return Object.keys(answers).filter((key) => answers[key] !== undefined && answers[key] !== "").length
  }

  const getProgressPercentage = () => {
    return (getAnsweredCount() / questions.length) * 100
  }

  const parseOptions = (options: any): string[] => {
    try {
      // If options is already an array, return it
      if (Array.isArray(options)) {
        return options;
      }
      
      // If options is a string that starts with [ and ends with ], parse it as JSON
      if (typeof options === 'string' && options.trim().startsWith('[') && options.trim().endsWith(']')) {
        return JSON.parse(options);
      }
      
      // If options is a string that might be a stringified JSON object
      if (typeof options === 'string') {
        try {
          const parsed = JSON.parse(options);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && parsed.options && Array.isArray(parsed.options)) return parsed.options;
        } catch (e) {
          console.warn('Failed to parse options:', e);
        }
      }
      
      // Default fallback
      return ["True", "False"];
    } catch (e) {
      console.warn('Error parsing options:', e);
      return ["True", "False"];
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    const answer = answers[question.id];
    const options = parseOptions(question.options);

    return (
      <Card key={question.id} className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">
              Question {index + 1} of {questions.length}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{question.points} points</Badge>
              {question.required && <Badge variant="destructive">Required</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-base leading-relaxed">{question.question}</p>
          </div>

          {question.type === "multiple-choice" && (
            <div className="space-y-3">
              {options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`${question.id}-${optionIndex}`}
                    name={question.id}
                    value={optionIndex}
                    checked={answer === optionIndex}
                    onChange={(e) => handleAnswerChange(question.id, Number.parseInt(e.target.value))}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`${question.id}-${optionIndex}`} className="text-sm cursor-pointer flex-1">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          )}

          {question.type === "true-false" && (
            <div className="space-y-3">
              {options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                  <input
                    type="radio"
                    id={`${question.id}-${optionIndex}`}
                    name={question.id}
                    value={optionIndex}
                    checked={answer === optionIndex}
                    onChange={(e) => handleAnswerChange(question.id, Number.parseInt(e.target.value))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label 
                    htmlFor={`${question.id}-${optionIndex}`} 
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          )}

          {question.type === "short-answer" && (
            <Input
              value={(answer as string) || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer..."
              className="w-full"
            />
          )}

          {question.type === "essay" && (
            <Textarea
              value={(answer as string) || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Write your essay response here..."
              className="min-h-[200px] w-full"
            />
          )}
        </CardContent>
      </Card>
    )
  }

  if (showConfirmSubmit) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Are you sure you want to submit your exam? You have answered {getAnsweredCount()} out of {questions.length}{" "}
            questions. This action cannot be undone.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>
            Continue Exam
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Exam"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with timer and progress */}
      <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <h2 className="text-xl font-bold">{exam.name}</h2>
          <p className="text-sm text-muted-foreground">
            Progress: {getAnsweredCount()} of {questions.length} questions answered
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${timeLeft < 300 ? "text-red-600" : ""}`}>
            <Clock className="inline h-5 w-5 mr-2" />
            {formatTime(timeLeft)}
          </div>
          <p className="text-sm text-muted-foreground">Time remaining</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(getProgressPercentage())}%</span>
        </div>
        <Progress value={getProgressPercentage()} className="w-full" />
      </div>

      {/* Time warning */}
      {timeLeft < 300 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Warning: Less than 5 minutes remaining! Your exam will be automatically submitted when time runs out.
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      {exam.instructions && (
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{exam.instructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-6">{questions.map((question, index) => renderQuestion(question, index))}</div>

      {/* Navigation and submit */}
      <div className="flex justify-between items-center p-4 border-t">
        <div className="text-sm text-muted-foreground">
          Auto-save is enabled. Your answers are being saved automatically.
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Exit Exam
          </Button>
          <Button
            onClick={() => setShowConfirmSubmit(true)}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Exam
          </Button>
        </div>
      </div>
    </div>
  )
}
