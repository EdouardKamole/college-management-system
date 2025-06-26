"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, GripVertical, Save, Eye } from "lucide-react"
import type { Exam, Question, Course } from "@/lib/data"

interface ExamCreatorProps {
  exam?: Exam | null
  onSave: (exam: Exam) => void
  onCancel: () => void
}

export function ExamCreator({ exam, onSave, onCancel }: ExamCreatorProps) {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Exam, 'id' | 'questions'> & { questions: Question[] }>({
    name: "",
    description: "",
    instructions: "",
    courseid: "",
    date: "",
    starttime: "",
    endtime: "",
    location: "",
    totalmarks: 100,
    duration: 60,
    totalpoints: 100,
    attempts: 1,
    status: "draft",
    questions: [],
    showresults: true,
    randomizequestions: false
  })
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        let query = supabase.from('courses').select('*')
        
        if (user?.role === 'instructor') {
          query = query.eq('instructorid', user.id)
        }
        
        const { data: courses, error } = await query
        
        if (error) throw error
        
        setCourses(courses || [])
      } catch (err) {
        console.error('Error fetching courses:', err)
        setError('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourses()
  }, [user])
  
  const userCourses = courses.filter((course) => 
    user?.role === "admin" || course.instructorid === user?.id || user?.role === "instructor"
  )

  useEffect(() => {
    if (exam) {
      setFormData({
        name: exam.name,
        description: exam.description,
        instructions: exam.instructions || "",
        courseid: exam.courseid,
        date: exam.date,
        starttime: exam.starttime,
        endtime: exam.endtime,
        location: exam.location || "",
        totalmarks: exam.totalmarks || 100,
        duration: exam.duration,
        totalpoints: exam.totalpoints || 100,
        attempts: exam.attempts,
        status: exam.status || "draft",
        questions: exam.questions || [],
        showresults: exam.showresults !== undefined ? exam.showresults : true,
        randomizequestions: exam.randomizequestions,
      })
      setQuestions(exam.questions)
    }
  }, [exam])

  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      type,
      question: "",
      points: 10,
      required: true,
      ...(type === "multiple-choice" && { options: ["", "", "", ""], correctAnswer: 0 }),
      ...(type === "true-false" && { options: ["True", "False"], correctAnswer: 0 }),
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newQuestions = [...questions]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < questions.length) {
      ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
      setQuestions(newQuestions)
    }
  }

  const calculateTotalPoints = () => {
    return questions.reduce((sum, q) => sum + q.points, 0)
  }

  const handleSave = async (status: "draft" | "published") => {
    if (!formData.name || !formData.courseid || questions.length === 0) {
      alert("Please fill in all required fields and add at least one question.")
      return
    }

    try {
      const examData: Exam = {
        id: exam?.id || uuidv4(),
        ...formData,
        status,
        questions,
        totalpoints: calculateTotalPoints(),
        createdby: user?.id || "",
        createdat: new Date().toISOString(),
      }
      onSave(examData)
    } catch (error) {
      console.error("Error saving exam:", error)
    }
  }

  const renderQuestionEditor = (question: Question, index: number) => {
    return (
      <Card key={question.id} className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              <CardTitle className="text-lg">Question {index + 1}</CardTitle>
              <Badge variant="outline">{question.type}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => moveQuestion(index, "up")} disabled={index === 0}>
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveQuestion(index, "down")}
                disabled={index === questions.length - 1}
              >
                ↓
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeQuestion(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`question-${index}`}>Question Text</Label>
            <Textarea
              id={`question-${index}`}
              value={question.question}
              onChange={(e) => updateQuestion(index, { question: e.target.value })}
              placeholder="Enter your question here..."
              className="min-h-[100px]"
            />
          </div>

          {(question.type === "multiple-choice" || question.type === "true-false") && (
            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2 mt-2">
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={question.correctanswer === optionIndex}
                      onChange={() => updateQuestion(index, { correctanswer: optionIndex })}
                      className="w-4 h-4"
                    />
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(question.options || [])]
                        newOptions[optionIndex] = e.target.value
                        updateQuestion(index, { options: newOptions })
                      }}
                      placeholder={`Option ${optionIndex + 1}`}
                      disabled={question.type === "true-false"}
                    />
                    {question.type === "multiple-choice" && question.options && question.options.length > 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOptions = question.options?.filter((_, i) => i !== optionIndex)
                          updateQuestion(index, { options: newOptions })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {question.type === "multiple-choice" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...(question.options || []), ""]
                      updateQuestion(index, { options: newOptions })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`points-${index}`}>Points</Label>
              <Input
                id={`points-${index}`}
                type="number"
                min="1"
                value={question.points}
                onChange={(e) => updateQuestion(index, { points: Number.parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id={`required-${index}`}
                checked={question.required}
                onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor={`required-${index}`}>Required</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Information</CardTitle>
          <CardDescription>Basic details about the examination</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Exam Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter exam name"
              />
            </div>
            <div>
              <Label htmlFor="course">Course</Label>
              <Select
                value={formData.courseid}
                onValueChange={(value) => {
                  console.log('Selected course ID:', value);
                  setFormData(prev => ({
                    ...prev,
                    courseid: value
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {userCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the exam"
            />
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Detailed instructions for students"
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule & Settings</CardTitle>
          <CardDescription>When and how the exam will be conducted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Exam Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.starttime}
                onChange={(e) => setFormData({ ...formData, starttime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endtime}
                onChange={(e) => setFormData({ ...formData, endtime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) || 60 })}
              />
            </div>
            <div>
              <Label htmlFor="attempts">Allowed Attempts</Label>
              <Input
                id="attempts"
                type="number"
                min="1"
                max="5"
                value={formData.attempts}
                onChange={(e) => setFormData({ ...formData, attempts: Number.parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showResults"
                checked={formData.showresults}
                onChange={(e) => setFormData({ ...formData, showresults: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="showResults">Show results to students</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="randomizeQuestions"
                checked={formData.randomizequestions}
                onChange={(e) => setFormData({ ...formData, randomizequestions: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="randomizeQuestions">Randomize question order</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Questions ({questions.length})</CardTitle>
              <CardDescription>Total Points: {calculateTotalPoints()}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select onValueChange={(value) => addQuestion(value as Question["type"])}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add Question" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="true-false">True/False</SelectItem>
                  <SelectItem value="short-answer">Short Answer</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No questions added yet. Use the dropdown above to add your first question.</p>
            </div>
          ) : (
            <div className="space-y-4">{questions.map((question, index) => renderQuestionEditor(question, index))}</div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={!formData.name || !formData.courseid}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave("published")}
            disabled={!formData.name || !formData.courseid || questions.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Publish Exam
          </Button>
        </div>
      </div>
    </div>
  )
}
