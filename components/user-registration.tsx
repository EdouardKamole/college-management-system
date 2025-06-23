"use client"

import { useState } from "react"
import { useData } from "@/hooks/use-data"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, CheckCircle, XCircle, GraduationCap, BookOpen, Shield } from "lucide-react"

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
  "Computer Studies",
]

export function UserRegistration() {
  const { data, updateData } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("student")

  // Student form data
  const [studentData, setStudentData] = useState({
    // Basic info
    name: "",
    email: "",
    username: "",
    password: "",
    pin: "",

    // Bio data
    dateOfBirth: "",
    homeDistrict: "",
    studentTelNo: "",
    fatherName: "",
    fatherContact: "",
    motherName: "",
    motherContact: "",
    nextOfKinName: "",
    nextOfKinContact: "",

    // Academic
    educationLevel: "",
    subjectCombination: [] as string[],
    totalPoints: 0,
    courseId: "",
    dateOfEnrollment: new Date().toISOString().split("T")[0],
  })

  // Staff/Admin form data
  const [staffData, setStaffData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    pin: "",
    role: "instructor" as "instructor" | "admin",
    department: "",
    qualification: "",
    experience: "",
    phoneNumber: "",
    address: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
  })

  const [eligibilityStatus, setEligibilityStatus] = useState<{
    eligible: boolean
    reasons: string[]
  }>({ eligible: true, reasons: [] })

  const generateCredentials = (type: "student" | "staff") => {
    const name = type === "student" ? studentData.name : staffData.name
    const username = name.toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random() * 1000)

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const pin = Math.floor(1000 + Math.random() * 9000).toString()

    if (type === "student") {
      setStudentData((prev) => ({ ...prev, username, password, pin }))
    } else {
      setStaffData((prev) => ({ ...prev, username, password, pin }))
    }
  }

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setStudentData((prev) => ({
      ...prev,
      subjectCombination: checked
        ? [...prev.subjectCombination, subject]
        : prev.subjectCombination.filter((s) => s !== subject),
    }))
  }

  const checkEligibility = () => {
    if (!studentData.courseId || !studentData.educationLevel || studentData.subjectCombination.length === 0) {
      return
    }

    const course = data.courses.find((c) => c.id === studentData.courseId)
    if (!course) return

    const reasons: string[] = []
    let eligible = true

    // Check education level
    if (!course.requiredEducationLevel?.includes(studentData.educationLevel as any)) {
      eligible = false
      reasons.push(`Course requires ${course.requiredEducationLevel?.join(" or ")} level education`)
    }

    // Check arts subjects
    const artsSubjects = ["History", "Literature", "Fine Art", "Music"]
    const hasArts = studentData.subjectCombination.some((subject) => artsSubjects.includes(subject))

    if (hasArts && course.category !== "technical") {
      eligible = false
      reasons.push("Students with arts combinations are not eligible for science-based courses")
    }

    // Check Physics or Math requirement
    const hasPhysicsOrMath =
      studentData.subjectCombination.includes("Physics") || studentData.subjectCombination.includes("Mathematics")
    if (!hasPhysicsOrMath) {
      eligible = false
      reasons.push("Combination must include at least Physics or Mathematics")
    }

    // Check minimum points
    if (studentData.totalPoints < (course.minimumPoints || 7)) {
      eligible = false
      reasons.push(`Minimum ${course.minimumPoints || 7} points required (you have ${studentData.totalPoints})`)
    }

    if (eligible) {
      reasons.push("All requirements met - eligible for enrollment")
    }

    setEligibilityStatus({ eligible, reasons })
  }

  const handleStudentSubmit = () => {
    // Basic validation
    if (
      !studentData.name ||
      !studentData.email ||
      !studentData.username ||
      !studentData.password ||
      !studentData.pin ||
      !studentData.courseId
    ) {
      alert("Please fill in all required fields")
      return
    }

    // Check eligibility
    checkEligibility()
    if (!eligibilityStatus.eligible) {
      alert("Student does not meet course requirements")
      return
    }

    // Check if username/email exists
    const existingUser = data.users.find((u) => u.username === studentData.username || u.email === studentData.email)
    if (existingUser) {
      alert("Username or email already exists")
      return
    }

    const newStudent = {
      id: Date.now().toString(),
      role: "student" as const,
      ...studentData,
      academicStatus: "active" as const,
      performancePrediction: "good" as const,
    }

    // Add to course
    const updatedCourses = data.courses.map((course) =>
      course.id === studentData.courseId
        ? { ...course, studentIds: [...(course.studentIds || []), newStudent.id] }
        : course,
    )

    updateData({
      ...data,
      users: [...data.users, newStudent],
      courses: updatedCourses,
    })

    alert("Student registered successfully!")
    resetForms()
    setIsOpen(false)
  }

  const handleStaffSubmit = () => {
    // Basic validation
    if (
      !staffData.name ||
      !staffData.email ||
      !staffData.username ||
      !staffData.password ||
      !staffData.pin ||
      !staffData.role
    ) {
      alert("Please fill in all required fields")
      return
    }

    // Check if username/email exists
    const existingUser = data.users.find((u) => u.username === staffData.username || u.email === staffData.email)
    if (existingUser) {
      alert("Username or email already exists")
      return
    }

    const newStaff = {
      id: Date.now().toString(),
      ...staffData,
    }

    updateData({
      ...data,
      users: [...data.users, newStaff],
    })

    alert(`${staffData.role === "admin" ? "Administrator" : "Instructor"} registered successfully!`)
    resetForms()
    setIsOpen(false)
  }

  const resetForms = () => {
    setStudentData({
      name: "",
      email: "",
      username: "",
      password: "",
      pin: "",
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
      courseId: "",
      dateOfEnrollment: new Date().toISOString().split("T")[0],
    })

    setStaffData({
      name: "",
      email: "",
      username: "",
      password: "",
      pin: "",
      role: "instructor",
      department: "",
      qualification: "",
      experience: "",
      phoneNumber: "",
      address: "",
      dateOfJoining: new Date().toISOString().split("T")[0],
    })

    setActiveTab("student")
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetForms()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>UAFC User Registration</DialogTitle>
          <DialogDescription>Register new students, instructors, or administrators</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="student" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Student
            </TabsTrigger>
            <TabsTrigger value="instructor" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Instructor
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Administrator
            </TabsTrigger>
          </TabsList>

          {/* Student Registration */}
          <TabsContent value="student" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Full Name *</Label>
                    <Input
                      id="student-name"
                      value={studentData.name}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email *</Label>
                    <Input
                      id="student-email"
                      type="email"
                      value={studentData.email}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="student@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-dob">Date of Birth *</Label>
                    <Input
                      id="student-dob"
                      type="date"
                      value={studentData.dateOfBirth}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-district">Home District *</Label>
                    <Select
                      value={studentData.homeDistrict}
                      onValueChange={(value) => setStudentData((prev) => ({ ...prev, homeDistrict: value }))}
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
                    <Label htmlFor="student-phone">Phone Number *</Label>
                    <Input
                      id="student-phone"
                      value={studentData.studentTelNo}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, studentTelNo: e.target.value }))}
                      placeholder="+256701234567"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Family Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Family Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="father-name">Father's Name *</Label>
                      <Input
                        id="father-name"
                        value={studentData.fatherName}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, fatherName: e.target.value }))}
                        placeholder="Father's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="father-contact">Father's Contact *</Label>
                      <Input
                        id="father-contact"
                        value={studentData.fatherContact}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, fatherContact: e.target.value }))}
                        placeholder="+256..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="mother-name">Mother's Name *</Label>
                      <Input
                        id="mother-name"
                        value={studentData.motherName}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, motherName: e.target.value }))}
                        placeholder="Mother's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother-contact">Mother's Contact *</Label>
                      <Input
                        id="mother-contact"
                        value={studentData.motherContact}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, motherContact: e.target.value }))}
                        placeholder="+256..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="kin-name">Next of Kin *</Label>
                      <Input
                        id="kin-name"
                        value={studentData.nextOfKinName}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, nextOfKinName: e.target.value }))}
                        placeholder="Next of kin name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kin-contact">Kin Contact *</Label>
                      <Input
                        id="kin-contact"
                        value={studentData.nextOfKinContact}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, nextOfKinContact: e.target.value }))}
                        placeholder="+256..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="education-level">Education Level *</Label>
                    <Select
                      value={studentData.educationLevel}
                      onValueChange={(value) => setStudentData((prev) => ({ ...prev, educationLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UACE">UACE (Science based)</SelectItem>
                        <SelectItem value="Diploma">Diploma (Science based)</SelectItem>
                        <SelectItem value="Degree">Degree (Science based)</SelectItem>
                        <SelectItem value="Master">Master Degree (Science based)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total-points">Total Points *</Label>
                    <Input
                      id="total-points"
                      type="number"
                      min="0"
                      max="30"
                      value={studentData.totalPoints}
                      onChange={(e) =>
                        setStudentData((prev) => ({ ...prev, totalPoints: Number.parseInt(e.target.value) || 0 }))
                      }
                      placeholder="Enter points"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-selection">Course Selection *</Label>
                    <Select
                      value={studentData.courseId}
                      onValueChange={(value) => {
                        setStudentData((prev) => ({ ...prev, courseId: value }))
                        setTimeout(checkEligibility, 100)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject Combination *</Label>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                    {ACCEPTABLE_SUBJECTS.map((subject) => (
                      <div key={subject} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject}`}
                          checked={studentData.subjectCombination.includes(subject)}
                          onCheckedChange={(checked) => {
                            handleSubjectChange(subject, checked as boolean)
                            setTimeout(checkEligibility, 100)
                          }}
                        />
                        <Label htmlFor={`subject-${subject}`} className="text-sm">
                          {subject}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {studentData.subjectCombination.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Subjects:</Label>
                    <div className="flex flex-wrap gap-2">
                      {studentData.subjectCombination.map((subject) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligibility Status */}
                {studentData.courseId && studentData.educationLevel && studentData.subjectCombination.length > 0 && (
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
              </CardContent>
            </Card>

            {/* Login Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Login Credentials
                  <Button type="button" variant="outline" size="sm" onClick={() => generateCredentials("student")}>
                    Generate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-username">Username *</Label>
                    <Input
                      id="student-username"
                      value={studentData.username}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password *</Label>
                    <Input
                      id="student-password"
                      value={studentData.password}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-pin">PIN *</Label>
                    <Input
                      id="student-pin"
                      value={studentData.pin}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, pin: e.target.value }))}
                      placeholder="Auto-generated"
                      maxLength={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instructor Registration */}
          <TabsContent value="instructor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructor-name">Full Name *</Label>
                    <Input
                      id="instructor-name"
                      value={staffData.name}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, name: e.target.value, role: "instructor" }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor-email">Email *</Label>
                    <Input
                      id="instructor-email"
                      type="email"
                      value={staffData.email}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="instructor@uafc.mil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor-phone">Phone Number</Label>
                    <Input
                      id="instructor-phone"
                      value={staffData.phoneNumber}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="+256701234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor-department">Department</Label>
                    <Input
                      id="instructor-department"
                      value={staffData.department}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g., Aviation, Engineering"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor-qualification">Qualification</Label>
                    <Input
                      id="instructor-qualification"
                      value={staffData.qualification}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, qualification: e.target.value }))}
                      placeholder="e.g., MSc Aviation, PhD Engineering"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor-experience">Experience (Years)</Label>
                    <Input
                      id="instructor-experience"
                      value={staffData.experience}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, experience: e.target.value }))}
                      placeholder="e.g., 5 years"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor-address">Address</Label>
                  <Input
                    id="instructor-address"
                    value={staffData.address}
                    onChange={(e) => setStaffData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Full address"
                  />
                </div>

                {/* Login Credentials */}
                <Separator />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Login Credentials</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => generateCredentials("staff")}>
                    Generate
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructor-username">Username *</Label>
                    <Input
                      id="instructor-username"
                      value={staffData.username}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor-password">Password *</Label>
                    <Input
                      id="instructor-password"
                      value={staffData.password}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor-pin">PIN *</Label>
                    <Input
                      id="instructor-pin"
                      value={staffData.pin}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, pin: e.target.value }))}
                      placeholder="Auto-generated"
                      maxLength={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Administrator Registration */}
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Administrator Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name">Full Name *</Label>
                    <Input
                      id="admin-name"
                      value={staffData.name}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, name: e.target.value, role: "admin" }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email *</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={staffData.email}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="admin@uafc.mil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-phone">Phone Number</Label>
                    <Input
                      id="admin-phone"
                      value={staffData.phoneNumber}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="+256701234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-department">Department</Label>
                    <Input
                      id="admin-department"
                      value={staffData.department}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g., Administration, Academic Affairs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-address">Address</Label>
                  <Input
                    id="admin-address"
                    value={staffData.address}
                    onChange={(e) => setStaffData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Full address"
                  />
                </div>

                {/* Login Credentials */}
                <Separator />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Login Credentials</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => generateCredentials("staff")}>
                    Generate
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Username *</Label>
                    <Input
                      id="admin-username"
                      value={staffData.username}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password *</Label>
                    <Input
                      id="admin-password"
                      value={staffData.password}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-pin">PIN *</Label>
                    <Input
                      id="admin-pin"
                      value={staffData.pin}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, pin: e.target.value }))}
                      placeholder="Auto-generated"
                      maxLength={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          {activeTab === "student" ? (
            <Button type="button" onClick={handleStudentSubmit}>
              Register Student
            </Button>
          ) : (
            <Button type="button" onClick={handleStaffSubmit}>
              Register {activeTab === "instructor" ? "Instructor" : "Administrator"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
