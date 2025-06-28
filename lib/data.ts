export interface User {
  id: string;
  role: "admin" | "instructor" | "student";
  name: string;
  email: string;
  // Student bio data
  dateofbirth?: string;
  homedistrict?: string;
  studenttelno?: string;
  fathername?: string;
  fathercontact?: string;
  mothername?: string;
  mothercontact?: string;
  nextofkinname?: string;
  nextofkincontact?: string;
  educationlevel?: "UACE" | "Diploma" | "Degree" | "Master";
  subjectcombination?: string[];
  totalpoints?: number;
  courseId?: string[];
  dateofenrollment?: string;
  academicstatus?: "active" | "probation" | "suspended" | "graduated";
  performanceprediction?: "excellent" | "good" | "average" | "poor" | "at-risk";
}

export interface Course {
  id: string;
  name: string;
  description: string;
  schedule: string;
  instructorid: string;
  studentids: string[];
  // Course requirements
  requirededucationlevel: ("UACE" | "Diploma" | "Degree" | "Master")[];
  requiredsubjects: string[];
  minimumpoints: number;
  passmark: number;
  duration: string; 
  category: "technical" | "engineering" | "operations" | "safety";
}

export interface Question {
  id: string;
  type: string; // e.g., 'multiple-choice', 'short-answer', etc.
  question: string;
  options?: string[];
  correctanswer?: string | number;
  points: number;
  required?: boolean;
}

export interface Exam {
  id: string;
  courseid: string;
  name: string;
  date: string;
  starttime: string;
  endtime: string;
  location: string;
  totalmarks: number;
  duration: number;
  totalpoints: number;
  attempts: number;
  description: string;
  instructions: string;
  status: 'draft' | 'published';
  questions: Question[];
  showresults?: boolean;
  randomizequestions?: boolean;
  createdby?: string;
  createdat?: string;
}

export interface Grade {
  id: string;
  studentid: string;
  courseid: string;
  examid?: string;
  name: string;
  score: number;
  maxscore: number;
  weight: number;
  date: string;
  feedback?: string;
  late: boolean;
  excused: boolean;
  category: string; 
}

export interface Attendance {
  id: string;
  studentid: string;
  courseid: string;
  date: string;
  status: string;
  notes?: string; // Optional notes field for attendance records
  markedBy?: string; // User who marked the attendance
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  courseId: string;
  category: "document" | "video" | "audio" | "image" | "presentation" | "assignment" | "reading" | "other";
  uploadedBy: string;
  uploadDate: string;
  isPublic: boolean;
  downloadCount: number;
  tags: string[];
}

export interface Schedule {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  type: "class" | "exam" | "meeting" | "event";
  // courseId: string;
  room?: string;
  description?: string;
  instructorid?: string;
  courseid: string;
  dayofweek: string;
  starttime: string;
  endtime: string;
  location: string;
}

export interface ExamSubmission {
  id: string;
  examid: string;
  studentid: string;
  submissiondate: string;
  fileurl?: string;
  marksawarded?: number;
  score?: number;
  maxscore?: number;
  status: 'in-progress' | 'submitted' | 'graded';
  answers?: Record<string, any>;
  starttime?: string;
  submittime?: string;
  timespent?: number;
  autograded?: boolean;
}

export interface GradeCategory {
  id: string;
  courseid: string;
  name: string;
  weight: number; 
  color: string;
  description?: string;
}

export interface CourseGrade {
  id: string;
  studentid: string;
  courseid: string;
  semester: string;
  year: number;
  credits: number;
  percentage: number;
  lettergrade: string;
  gpa: number;
  finallettergrade?: string;
  iscomplete: boolean;
}

export interface GradeScale {
  id: string;
  name: string;
  scale: {
    letter: string;
    minpercentage: number;
    maxpercentage: number;
    gpapoints: number;
  }[];
}

export interface Transcript {
  id: string;
  studentid: string;
  generateddate: string;
  generatedby: string;
  semesters: {
    semester: string;
    year: number;
    courses: CourseGrade[];
    semestergpa: number;
    semestercredits: number;
  }[];
  cumulativegpa: number;
  totalcredits: number;
  academicstanding: string;
}

export interface StudentPerformance {
  id: string;
  studentid: string;
  courseid: string;
  weeklytests: {
    week: number;
    score: number;
    maxscore: number;
    date: string;
  }[];
  monthlytests: {
    month: number;
    score: number;
    maxscore: number;
    date: string;
  }[];
  moduleexams: {
    moduleid: string;
    score: number;
    maxscore: number;
    date: string;
    passed: boolean;
  }[];
  overallperformance: number;
  predictionstatus: "excellent" | "good" | "average" | "poor" | "at-risk";
  lastupdated: string;
}

// Update the main data interface
interface AppData {
  users: User[];
  courses: Course[];
  exams: Exam[];
  grades: Grade[];
  attendance: Attendance[];
  resources: Resource[];
  schedules: Schedule[];
  examsubmissions: ExamSubmission[];
  gradecategories: GradeCategory[];
  coursegrades: CourseGrade[];
  gradescales: GradeScale[];
  transcripts: Transcript[];
  studentperformances: StudentPerformance[];
}

export interface User { /* ... existing User interface ... */ }
export interface Course { /* ... existing Course interface ... */ }
