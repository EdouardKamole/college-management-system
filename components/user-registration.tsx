"use client"

import { useState } from "react"
import { v4 as uuidv4 } from 'uuid'
import { useSupabaseData } from "@/hooks/use-supabase-data"
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
import { supabase } from "@/lib/supabase"

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
  const { data, loading: coursesLoading, error: coursesError } = useSupabaseData();
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("student")

  // Student form data
  const [studentData, setStudentData] = useState({
    // Basic info
    name: "",
    email: "",
    password: "",
    // Bio data
    dateofbirth: "",
    homedistrict: "",
    studenttelno: "",
    fathername: "",
    fathercontact: "",
    mothername: "",
    mothercontact: "",
    nextofkinname: "",
    nextofkincontact: "",
    // Academic
    educationlevel: "",
    subjectcombination: [] as string[],
    totalpoints: 10,
    courseid: [] as string[],
    dateofenrollment: new Date().toISOString().split("T")[0],
  })

  // Staff/Admin form data
  const [staffData, setStaffData] = useState({
    name: "",
    email: "",
    password: "",
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
      setStudentData((prev) => ({ ...prev, password }))
    } else {
      setStaffData((prev) => ({ ...prev, password }))
    }
  }

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setStudentData((prev) => ({
      ...prev,
      subjectcombination: checked
        ? [...prev.subjectcombination, subject]
        : prev.subjectcombination.filter((s) => s !== subject),
    }))
  }

  const checkEligibility = () => {
    if (studentData.courseid.length === 0 || !studentData.educationlevel || studentData.subjectcombination.length === 0) {
      return
    }

    const reasons: string[] = [];
    let eligible = true;

    for (const courseId of studentData.courseid) {
      const course = data.courses.find((c) => c.id === courseId);
      if (!course) continue;

      // Check education level
      if (!course.requirededucationlevel?.includes(studentData.educationlevel as any)) {
        eligible = false;
        reasons.push(`Course "${course.name}": requires ${course.requirededucationlevel?.join(" or ")} level education`);
      }

      // Check arts subjects
      const artsSubjects = ["History", "Literature", "Fine Art", "Music"];
      const hasArts = studentData.subjectcombination.some((subject) => artsSubjects.includes(subject));
      if (hasArts && course.category !== "technical") {
        eligible = false;
        reasons.push(`Course "${course.name}": students with arts combinations are not eligible for science-based courses`);
      }

      // Check Physics or Math requirement
      const hasPhysicsOrMath =
        studentData.subjectcombination.includes("Physics") || studentData.subjectcombination.includes("Mathematics");
      if (!hasPhysicsOrMath) {
        eligible = false;
        reasons.push(`Course "${course.name}": combination must include at least Physics or Mathematics`);
      }

      // Check minimum points
      if (studentData.totalpoints < (course.minimumpoints || 7)) {
        eligible = false;
        reasons.push(`Course "${course.name}": minimum ${course.minimumpoints || 7} points required (you have ${studentData.totalpoints})`);
      }
    }

    if (eligible && studentData.courseid.length > 0) {
      reasons.push("All requirements met - eligible for enrollment in all selected courses");
    }

    setEligibilityStatus({ eligible, reasons });
  }

  const handleStudentSubmit = async () => {
    // Basic validation
    if (
      !studentData.name ||
      !studentData.email ||
      !studentData.password ||
      studentData.courseid.length === 0
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
    const existingUser = data.users.find((u) => u.email === studentData.email)
    if (existingUser) {
      alert("Username or email already exists");
      return;
    }

    try {
      // Supabase signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentData.email,
        password: studentData.password,
        options: {
          data: {
            name: studentData.name,
            role: 'student',
          }
        }
      });
      if (authError) {
        alert(`Failed to create user account: ${authError.message}`);
        return;
      }
      const supabaseUserId = authData.user?.id
      if (!supabaseUserId) {
        alert('Failed to get user ID from Supabase Auth')
        return
      }

      // 2. Store user data in users table
      const { password, ...studentDataNoPassword } = studentData;
      const newStudent = {
        id: supabaseUserId,
        role: "student" as const,
        ...studentDataNoPassword,
        academicstatus: "active" as const,
        performanceprediction: "good" as const,
      }

      // Add to course
      const updatedCourses = data.courses.map((course) =>
        studentData.courseid.includes(course.id)
          ? { ...course, studentids: [...(course.studentids || []), newStudent.id] }
          : course,
      )

      // 3. Insert new student in users table
      const { error: insertError } = await supabase.from('users').insert([newStudent]);
      if (insertError) {
        alert(`Failed to save student: ${insertError.message}`);
        return;
      }

      // 4. Update course to add student ID
      for (const courseId of studentData.courseid) {
        const courseToUpdate = updatedCourses.find(c => c.id === courseId);
        if (courseToUpdate) {
          const { error: courseError } = await supabase.from('courses').update({ studentids: courseToUpdate.studentids }).eq('id', courseToUpdate.id);
          if (courseError) {
            alert(`Failed to update course: ${courseError.message}`);
            return;
          }
        }
      }

      alert("Student registered successfully!");
      resetForms();
      setIsOpen(false);
    } catch (err: any) {
      alert(`An error occurred: ${err.message}`)
    }
  }

  const handleStaffSubmit = async () => {
    // Basic validation
    if (
      !staffData.name ||
      !staffData.email ||
      !staffData.password ||
      !staffData.role
    ) {
      alert("Please fill in all required fields")
      return
    }

    // Check if username/email exists
    const existingUser = data.users.find((u) => u.email === staffData.email)
    if (existingUser) {
      alert("Username or email already exists")
      return
    }

    try {
      // 1. Create Supabase Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: staffData.email,
        password: staffData.password,
        options: {
          data: {
            name: staffData.name,
            role: staffData.role,
          }
        }
      });
      if (authError) {
        alert(`Failed to create staff account: ${authError.message}`);
        return;
      }
      const supabaseUserId = authData.user?.id || uuidv4();
      if (!supabaseUserId) {
        alert('Failed to get user ID from Supabase Auth');
        return;
      }

      const { password, ...staffDataNoPassword } = staffData;

      // 2. Store user data in users table
      const newStaff = {
        id: supabaseUserId,
        ...staffDataNoPassword,
      };
      const { error: insertError } = await supabase.from('users').insert([{ ...newStaff }]);
      if (insertError) {
        alert(`Failed to save staff: ${insertError.message}`);
        return;
      }
      alert(`${staffData.role === "admin" ? "Administrator" : "Instructor"} registered successfully!`);
      resetForms();
      setIsOpen(false);
    } catch (err: any) {
      alert(`An error occurred: ${err.message}`);
    }
  }

  const resetForms = () => {
    setStudentData({
      name: "",
      email: "",
      password: "",
      dateofbirth: "",
      homedistrict: "",
      studenttelno: "",
      fathername: "",
      fathercontact: "",
      mothername: "",
      mothercontact: "",
      nextofkinname: "",
      nextofkincontact: "",
      educationlevel: "",
      subjectcombination: [],
      totalpoints: 0,
      courseid: [],
      dateofenrollment: new Date().toISOString().split("T")[0],
    })

    setStaffData({
      name: "",
      email: "",
      password: "",
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
                      value={studentData.dateofbirth}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, dateofbirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-district">Home District *</Label>
                    <Select
                      value={studentData.homedistrict}
                      onValueChange={(value) => setStudentData((prev) => ({ ...prev, homedistrict: value }))}
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
                      value={studentData.studenttelno}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, studenttelno: e.target.value }))}
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
                        value={studentData.fathername}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, fathername: e.target.value }))}
                        placeholder="Father's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="father-contact">Father's Contact *</Label>
                      <Input
                        id="father-contact"
                        value={studentData.fathercontact}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, fathercontact: e.target.value }))}
                        placeholder="+256..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="mother-name">Mother's Name *</Label>
                      <Input
                        id="mother-name"
                        value={studentData.mothername}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, mothername: e.target.value }))}
                        placeholder="Mother's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother-contact">Mother's Contact *</Label>
                      <Input
                        id="mother-contact"
                        value={studentData.mothercontact}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, mothercontact: e.target.value }))}
                        placeholder="+256..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="kin-name">Next of Kin *</Label>
                      <Input
                        id="kin-name"
                        value={studentData.nextofkinname}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, nextofkinname: e.target.value }))}
                        placeholder="Next of kin name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kin-contact">Kin Contact *</Label>
                      <Input
                        id="kin-contact"
                        value={studentData.nextofkincontact}
                        onChange={(e) => setStudentData((prev) => ({ ...prev, nextofkincontact: e.target.value }))}
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
                      value={studentData.educationlevel}
                      onValueChange={(value) => setStudentData((prev) => ({ ...prev, educationlevel: value }))}
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
                      min="1"
                      max="30"
                      value={studentData.totalpoints}
                      onChange={(e) =>
                        setStudentData((prev) => ({ ...prev, totalpoints: Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value) }))
                      }
                      placeholder="Enter total points (e.g., 15)"
                    />
                    <small className="text-muted-foreground">Enter the student's total academic points (0-30).</small>
                  </div>
                  <div className="space-y-2">
                    <Label>Course Selection *</Label>
                    <div className="grid gap-2 max-h-32 overflow-y-auto border rounded p-3">
                      {coursesLoading ? (
                        <div className="p-2 text-sm text-gray-500">Loading courses...</div>
                      ) : coursesError ? (
                        <div className="p-2 text-sm text-red-500">{coursesError}</div>
                      ) : data.courses.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No courses available</div>
                      ) : (
                        data.courses.map((course) => (
                          <div key={course.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`course-${course.id}`}
                              checked={studentData.courseid.includes(course.id)}
                              onCheckedChange={(checked) => {
                                setStudentData((prev) => ({
                                  ...prev,
                                  courseid: checked
                                    ? [...prev.courseid, course.id]
                                    : prev.courseid.filter((id) => id !== course.id),
                                }))
                                setTimeout(checkEligibility, 100)
                              }}
                            />
                            <Label htmlFor={`course-${course.id}`} className="text-sm">
                              {course.name}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject Combination *</Label>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                    {ACCEPTABLE_SUBJECTS.map((subject) => (
                      <div key={subject} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject}`}
                          checked={studentData.subjectcombination.includes(subject)}
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

                {studentData.subjectcombination.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Subjects:</Label>
                    <div className="flex flex-wrap gap-2">
                      {studentData.subjectcombination.map((subject) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligibility Status */}
                {studentData.courseid.length > 0 && studentData.educationlevel && studentData.subjectcombination.length > 0 && (
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
                    <Label htmlFor="student-password">Password *</Label>
                    <Input
                      id="student-password"
                      value={studentData.password}
                      onChange={(e) => setStudentData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Auto-generated"
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
                    <Label htmlFor="instructor-password">Password *</Label>
                    <Input
                      id="instructor-password"
                      value={staffData.password}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Auto-generated"
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
                    <Label htmlFor="admin-password">Password *</Label>
                    <Input
                      id="admin-password"
                      value={staffData.password}
                      onChange={(e) => setStaffData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Auto-generated"
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
