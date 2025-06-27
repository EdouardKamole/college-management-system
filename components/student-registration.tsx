"use client"

import { useState, useEffect } from "react"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { UserPlus, CheckCircle, XCircle, Calendar, Phone, User, GraduationCap } from "lucide-react"

interface StudentFormData {
  // Basic Info
  name: string
  email: string
  password: string

  // Bio Data
  dateOfBirth: string
  homeDistrict: string
  studentTelNo: string
  fatherName: string
  fatherContact: string
  motherName: string
  motherContact: string
  nextOfKinName: string
  nextOfKinContact: string

  // Academic Info
  educationLevel: "UACE" | "Diploma" | "Degree" | "Master" | ""
  subjectCombination: string[]
  totalPoints: number
  courseIds: string[]
  dateOfEnrollment: string
}

const UGANDA_DISTRICTS = [
  "Kampala",
  "Wakiso",
  "Mukono",
  "Jinja",
  "Mbale",
  "Gulu",
  "Lira",
  "Mbarara",
  "Masaka",
  "Kasese",
  "Fort Portal",
  "Kabale",
  "Soroti",
  "Arua",
  "Kitgum",
  "Moroto",
  "Hoima",
  "Masindi",
  "Mityana",
  "Mubende",
  "Rakai",
  "Sembabule",
  "Lyantonde",
  "Kiruhura",
  "Ibanda",
  "Isingiro",
  "Ntungamo",
  "Rukungiri",
  "Kanungu",
  "Kisoro",
  "Nebbi",
  "Zombo",
  "Pakwach",
  "Adjumani",
  "Moyo",
  "Yumbe",
  "Koboko",
  "Maracha",
  "Oyam",
  "Apac",
  "Kole",
  "Dokolo",
  "Amolatar",
  "Kaberamaido",
  "Katakwi",
  "Amuria",
  "Napak",
  "Amudat",
  "Nakapiripirit",
  "Abim",
  "Kotido",
  "Kaabong",
]

const ACCEPTABLE_SUBJECTS = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Economics",
  "Geography",
  "History",
  "Literature",
  "Fine Art",
  "Music",
  "Divinity",
  "Islamic Studies",
  "Computer Studies",
  "Technical Drawing",
  "Food and Nutrition",
  "Entrepreneurship",
]

const ACCEPTABLE_COMBINATIONS = [
  ["Physics", "Chemistry", "Mathematics"], // PCM
  ["Physics", "Chemistry", "Biology"], // PCB
  ["Physics", "Economics", "Mathematics"], // PEM
  ["Physics", "Fine Art", "Mathematics"], // PAM
  ["Biology", "Chemistry", "Mathematics"], // BCM
  ["Mathematics", "Economics", "Geography"], // MEG
]

export function StudentRegistration() {
  const { data, refetch, addUser, updateCourse } = useSupabaseData()
  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCourses() {
      setCoursesLoading(true)
      setCoursesError(null)
      const { data: coursesData, error } = await supabase.from("courses").select("*")
      if (error) {
        setCoursesError("Failed to fetch courses")
        setCourses([])
      } else {
        setCourses(coursesData || [])
      }
      setCoursesLoading(false)
    }
    fetchCourses()
  }, [])
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [eligibilityStatus, setEligibilityStatus] = useState<{
    eligible: boolean
    reasons: string[]
  }>({ eligible: false, reasons: [] })

  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    email: "",
    password: "",
    dateOfBirth: "",
    homeDistrict: "",
    studentTelNo: "",
    fatherName: "",
    fatherContact: "",
    motherName: "",
    motherContact: "",
    nextOfKinName: "",
    nextOfKinContact: "",
    educationLevel: "",
    subjectCombination: [],
    totalPoints: 0,
    courseIds: [],
    dateOfEnrollment: new Date().toISOString().split("T")[0],
  })

  // Check course eligibility (use first selected course for eligibility)
  useEffect(() => {
    if (formData.courseIds.length > 0 && formData.educationLevel && formData.subjectCombination.length > 0) {
      checkEligibility()
    }
  }, [formData.courseIds, formData.educationLevel, formData.subjectCombination, formData.totalPoints])

  const checkEligibility = () => {
    // Use the first selected course for eligibility check
    const course = data.courses.find((c) => c.id === formData.courseIds[0])
    if (!course) return

    const reasons: string[] = []
    let eligible = true

    // Check education level
    if (!course.requirededucationlevel.includes(formData.educationLevel as any)) {
      eligible = false
      reasons.push(`Course requires ${course.requirededucationlevel.join(" or ")} level education`)
    }

    // Check if combination has arts subjects (not eligible for science courses)
    const artsSubjects = ["History", "Literature", "Fine Art", "Music", "Divinity", "Islamic Studies"]
    const hasArts = formData.subjectCombination.some((subject) => artsSubjects.includes(subject))

    if (hasArts && course.category !== "technical") {
      eligible = false
      reasons.push("Students with arts combinations are not eligible for science-based courses")
    }

    // Check if combination is acceptable
    const hasPhysicsOrMath =
      formData.subjectCombination.includes("Physics") || formData.subjectCombination.includes("Mathematics")
    if (!hasPhysicsOrMath) {
      eligible = false
      reasons.push("Combination must include at least Physics or Mathematics")
    }

    // Check required subjects for course
    const missingSubjects = course.requiredsubjects.filter((subject) => !formData.subjectCombination.includes(subject))
    if (missingSubjects.length > 0) {
      eligible = false
      reasons.push(`Course requires: ${missingSubjects.join(", ")}`)
    }

    // Check minimum points
    if (formData.totalPoints < course.minimumpoints) {
      eligible = false
      reasons.push(`Minimum ${course.minimumpoints} points required (you have ${formData.totalPoints})`)
    }

    if (eligible) {
      reasons.push("All requirements met - eligible for enrollment")
    }

    setEligibilityStatus({ eligible, reasons })
  }

  const generateCredentials = () => {
    // Generate username from name
    const username = formData.name.toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random() * 1000)

    // Generate password
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Generate PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString()

    setFormData((prev) => ({ ...prev, username, password, pin }))
  }

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      subjectCombination: checked
        ? [...prev.subjectCombination, subject]
        : prev.subjectCombination.filter((s) => s !== subject),
    }))
  }

  const handleSubmit = async () => {
    if (!eligibilityStatus.eligible) {
      alert("Student does not meet course requirements")
      return
    }

    // Check if username/email already exists
    const existingUser = data.users.find((u) => u.email === formData.email)
    if (existingUser) {
      alert("Username or email already exists")
      return
    }

    try {
      // 1. Create Supabase Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: 'student',
          }
        }
      })
      if (authError) {
        alert(`Failed to create user account: ${authError.message}`)
        return
      }
      const supabaseUserId = authData.user?.id
      if (!supabaseUserId) {
        alert('Failed to get user ID from Supabase Auth')
        return
      }

      // 2. Store user data in users table
      const { password, ...formDataNoPassword } = formData;
      const newStudent = {
        id: supabaseUserId,
        role: "student" as const,
        ...formDataNoPassword,
        academicStatus: "active" as const,
        performancePrediction: "good" as const,
      }

      // Insert new student into users table
      await addUser(newStudent)

      // Add student to all selected courses
      for (const courseId of formData.courseIds) {
        const courseToUpdate = data.courses.find((course) => course.id === courseId)
        if (courseToUpdate) {
          await updateCourse(courseToUpdate.id, {
            studentids: [...(courseToUpdate.studentids || []), newStudent.id],
          })
        }
      }

      await refetch()

      // Reset form and close
      setFormData({
        name: "",
        email: "",
        password: "",
        dateOfBirth: "",
        homeDistrict: "",
        studentTelNo: "",
        fatherName: "",
        fatherContact: "",
        motherName: "",
        motherContact: "",
        nextOfKinName: "",
        nextOfKinContact: "",
        educationLevel: "",
        subjectCombination: [],
        totalPoints: 0,
        courseIds: [],
        dateOfEnrollment: new Date().toISOString().split("T")[0],
      })
      setIsOpen(false)
    } catch (err: any) {
      alert(`An error occurred: ${err.message}`)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Register Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            UAFC Student Registration
          </DialogTitle>
          <DialogDescription>
            Complete student bio data and course selection - Step {currentStep} of 4
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`flex items-center ${step < 4 ? "flex-1" : ""}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 4 && <div className={`flex-1 h-1 mx-2 ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="homeDistrict">Home District *</Label>
                    <Select
                      value={formData.homeDistrict}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, homeDistrict: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {UGANDA_DISTRICTS.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentTelNo">Student Phone Number *</Label>
                    <Input
                      id="studentTelNo"
                      value={formData.studentTelNo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, studentTelNo: e.target.value }))}
                      placeholder="+256701234567"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Family Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Family & Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name *</Label>
                    <Input
                      id="fatherName"
                      value={formData.fatherName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fatherName: e.target.value }))}
                      placeholder="Enter father's name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherContact">Father's Contact *</Label>
                    <Input
                      id="fatherContact"
                      value={formData.fatherContact}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fatherContact: e.target.value }))}
                      placeholder="+256701234567"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother's Name *</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, motherName: e.target.value }))}
                      placeholder="Enter mother's name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherContact">Mother's Contact *</Label>
                    <Input
                      id="motherContact"
                      value={formData.motherContact}
                      onChange={(e) => setFormData((prev) => ({ ...prev, motherContact: e.target.value }))}
                      placeholder="+256701234567"
                      required
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinName">Next of Kin Name *</Label>
                    <Input
                      id="nextOfKinName"
                      value={formData.nextOfKinName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nextOfKinName: e.target.value }))}
                      placeholder="Enter next of kin name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinContact">Next of Kin Contact *</Label>
                    <Input
                      id="nextOfKinContact"
                      value={formData.nextOfKinContact}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nextOfKinContact: e.target.value }))}
                      placeholder="+256701234567"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Academic Information */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Academic Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div  className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="educationLevel">Education Level *</Label>
 <Select
  value={formData.educationLevel}
  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, educationLevel: value }))} 
  
>
  
  <SelectTrigger>
    <SelectValue placeholder="Select education level" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="UACE">UACE (Science based)</SelectItem>
    <SelectItem value="Diploma">Diploma (Science based)</SelectItem>
    <SelectItem value="Degree">Degree (Science based)</SelectItem>
    <SelectItem value="Master">Master Degree (Science based)</SelectItem>
  </SelectContent>
</Select>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                    {ACCEPTABLE_SUBJECTS.map((subject) => (
                      <div key={subject} className="flex items-center space-x-2">
                        <Checkbox
                          id={subject}
                          checked={formData.subjectCombination.includes(subject)}
                          onCheckedChange={(checked) => handleSubjectChange(subject, checked as boolean)}
                        />
                        <Label htmlFor={subject} className="text-sm">
                          {subject}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select your subject combination. Must include at least Physics or Mathematics.
                  </p>
                </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPoints">Total Points *</Label>
                  <Input
                    id="totalPoints"
                    type="number"
                    value={formData.totalPoints}
                    onChange={e => setFormData(prev => ({ ...prev, totalPoints: Number(e.target.value) }))}
                    placeholder="Enter total points"
                    min={10}
                    required
                  />
                </div>

                {formData.subjectCombination.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Subjects:</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.subjectCombination.map((subject) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Course Selection & Eligibility */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Course Selection & Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Courses to Enroll *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded p-3">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={course.id}
                          checked={formData.courseIds.includes(course.id)}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              courseIds: checked
                                ? [...prev.courseIds, course.id]
                                : prev.courseIds.filter((id) => id !== course.id),
                            }))
                          }}
                        />
                        <Label htmlFor={course.id} className="text-sm">
                          {course.name} ({course.duration} months)
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Show eligibility for the first selected course only for now */}
                {formData.courseIds.length > 0 && formData.educationLevel && formData.subjectCombination.length > 0 && (
                  <Alert className={eligibilityStatus.eligible ? "border-green-500" : "border-red-500"}>
                    <div className="flex items-center gap-2">
                      {eligibilityStatus.eligible ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription>
                        <strong>Eligibility Status:</strong>
                        <ul className="mt-2 space-y-1">
                          {eligibilityStatus.reasons.map((reason, index) => (
                            <li key={index} className="text-sm">
                              • {reason}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="dateOfEnrollment">Date of Enrollment *</Label>
                  <Input
                    id="dateOfEnrollment"
                    type="date"
                    value={formData.dateOfEnrollment}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateOfEnrollment: e.target.value }))}
                    required
                  />
                </div>
                {formData.courseIds.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Course Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const course = data.courses.find((c) => c.id === formData.courseIds[0])
                        return course ? (
                          <div className="space-y-2">
                            <p>
                              <strong>Course:</strong> {course.name}
                            </p>
                            <p>
                              <strong>Duration:</strong> {course.duration} months
                            </p>
                            <p>
                              <strong>Pass Mark:</strong> {course.passmark}%
                            </p>
                            <p>
                              <strong>Required Subjects:</strong> {course.requiredsubjects.join(", ")}
                            </p>
                            <p>
                              <strong>Minimum Points:</strong> {course.minimumpoints}
                            </p>
                            <p>
                              <strong>Category:</strong> {course.category}
                            </p>
                          </div>
                        ) : null
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Login Credentials */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Login Credentials
                      <Button type="button" variant="outline" size="sm" onClick={generateCredentials}>
                        Generate
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          value={formData.password}
                          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder="Auto-generated"
                        />
                      </div>
                      
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
          </div>
          <div className="space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={!eligibilityStatus.eligible}>
                Register Student
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
