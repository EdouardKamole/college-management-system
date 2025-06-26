export interface User {
  id: string;
  username: string;
  password: string;
  pin: string;
  role: "admin" | "instructor" | "student";
  name: string;
  email: string;
  // Student bio data
  dateOfBirth?: string;
  homeDistrict?: string;
  studentTelNo?: string;
  fatherName?: string;
  fatherContact?: string;
  motherName?: string;
  motherContact?: string;
  nextOfKinName?: string;
  nextOfKinContact?: string;
  educationLevel?: "UACE" | "Diploma" | "Degree" | "Master";
  subjectCombination?: string[];
  totalPoints?: number;
  courseId?: string;
  dateOfEnrollment?: string;
  academicStatus?: "active" | "probation" | "suspended" | "graduated";
  performancePrediction?: "excellent" | "good" | "average" | "poor" | "at-risk";
}

export interface Course {
  id: string;
  name: string;
  description: string;
  schedule: string;
  instructorId: string;
  studentIds: string[];
  // Course requirements
  requiredEducationLevel: ("UACE" | "Diploma" | "Degree" | "Master")[];
  requiredSubjects: string[];
  minimumPoints: number;
  passMark: number;
  duration: string; // in months
  category: "technical" | "engineering" | "operations" | "safety";
}

export interface Question {
  id: string;
  type: string; // e.g., 'multiple-choice', 'short-answer', etc.
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  required?: boolean;
}

export interface Exam {
  id: string;
  courseId: string;
  name: string;
  date: string;
  time: string;
  location: string;
  totalMarks: number;
  startTime: string;
  endTime: string;
  duration: number;
  totalPoints: number;
  attempts: number;
  description: string;
  status: string;
  questions: Question[];
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  examId?: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  date: string;
  feedback?: string;
  late: boolean;
  excused: boolean;
  category: string; 
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: string;
}

export interface Resource {
  id: string;
  courseId: string;
  title: string;
  description: string;
  fileUrl: string;
  uploadDate: string;
}

export interface Schedule {
  id: string;
  courseId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  submissionDate: string;
  fileUrl: string;
  marksAwarded?: number;
  status: 'in-progress' | 'submitted' | 'graded';
}

export interface GradeCategory {
  id: string;
  courseId: string;
  name: string;
  weight: number; // percentage weight in final grade
  color: string;
  description?: string;
}

export interface CourseGrade {
  id: string;
  studentId: string;
  courseId: string;
  semester: string;
  year: number;
  credits: number;
  percentage: number;
  letterGrade: string;
  gpa: number;
  finalLetterGrade?: string;
  isComplete: boolean;
}

export interface GradeScale {
  id: string;
  name: string;
  scale: {
    letter: string;
    minPercentage: number;
    maxPercentage: number;
    gpaPoints: number;
  }[];
}

export interface Transcript {
  id: string;
  studentId: string;
  generatedDate: string;
  generatedBy: string;
  semesters: {
    semester: string;
    year: number;
    courses: CourseGrade[];
    semesterGPA: number;
    semesterCredits: number;
  }[];
  cumulativeGPA: number;
  totalCredits: number;
  academicStanding: string;
}

export interface StudentPerformance {
  id: string;
  studentId: string;
  courseId: string;
  weeklyTests: {
    week: number;
    score: number;
    maxScore: number;
    date: string;
  }[];
  monthlyTests: {
    month: number;
    score: number;
    maxScore: number;
    date: string;
  }[];
  moduleExams: {
    moduleId: string;
    score: number;
    maxScore: number;
    date: string;
    passed: boolean;
  }[];
  overallPerformance: number;
  predictionStatus: "excellent" | "good" | "average" | "poor" | "at-risk";
  lastUpdated: string;
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
  examSubmissions: ExamSubmission[];
  gradeCategories: GradeCategory[];
  courseGrades: CourseGrade[];
  gradeScales: GradeScale[];
  transcripts: Transcript[];
  studentPerformances: StudentPerformance[];
}

// Export interfaces and types
export interface User { /* ... existing User interface ... */ }
export interface Course { /* ... existing Course interface ... */ }
// ... other interfaces ...

// Initial data
const initialData: AppData = {
  users: [
    {
      id: "27b12d91-482f-49dc-8279-27606a53e5bf",
      username: "admin",
      password: "admin123",
      pin: "1234",
      role: "admin" as const,
      name: "Colonel James Smith",
      email: "admin@uafc.mil",
    },
    {
      id: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      username: "instructor1",
      password: "inst123",
      pin: "5678",
      role: "instructor" as const,
      name: "Major Sarah Johnson",
      email: "sarah.johnson@uafc.mil",
    },
    {
      id: "58e6b4c9-7d3e-5f2a-0b4c-9e1f2a3b4c5d",
      username: "student1",
      password: "stud123",
      pin: "9012",
      role: "student" as const,
      name: "Cadet Michael Brown",
      email: "michael.brown@uafc.mil",
      dateOfBirth: "2000-05-15",
      homeDistrict: "Kampala",
      studentTelNo: "+256701234567",
      fatherName: "Robert Brown",
      fatherContact: "+256701234568",
      motherName: "Mary Brown",
      motherContact: "+256701234569",
      nextOfKinName: "John Brown",
      nextOfKinContact: "+256701234570",
      educationLevel: "UACE" as const,
      subjectCombination: ["Physics", "Chemistry", "Mathematics"],
      totalPoints: 15,
      courseId: "69f7c8d0-8e3f-6a5b-1c2d-3e4f5a6b7c8d",
      dateOfEnrollment: "2024-01-15",
      academicStatus: "active" as const,
      performancePrediction: "good" as const,
    },
  ],
  courses: [
    {
      id: "69f7c8d0-8e3f-6a5b-1c2d-3e4f5a6b7c8d",
      name: "Piloting Course",
      description: "Comprehensive pilot training program",
      schedule: "Mon-Fri 08:00-17:00",
      instructorId: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentIds: ["58e6b4c9-7d3e-5f2a-0b4c-9e1f2a3b4c5d"],
      requiredEducationLevel: ["UACE", "Diploma", "Degree"],
      requiredSubjects: ["Physics", "Mathematics"],
      minimumPoints: 7,
      passMark: 75,
      duration: "24",
      category: "operations",
    },
    {
      id: "7a08d9e1-9f4a-7b6c-2d3e-4f5a6b7c8d9e",
      name: "Electrical Engineering Course",
      description: "Electrical systems and engineering principles",
      schedule: "Mon-Fri 08:00-17:00",
      instructorId: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentIds: [],
      requiredEducationLevel: ["UACE", "Diploma", "Degree"],
      requiredSubjects: ["Physics", "Mathematics"],
      minimumPoints: 7,
      passMark: 75,
      duration: "18",
      category: "engineering",
    },
    {
      id: "8b1c9d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e",
      name: "Mechanical Engineering Course",
      description: "Mechanical systems and maintenance",
      schedule: "Mon-Fri 08:00-17:00",
      instructorId: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentIds: [],
      requiredEducationLevel: ["UACE", "Diploma", "Degree"],
      requiredSubjects: ["Physics", "Mathematics"],
      minimumPoints: 7,
      passMark: 75,
      duration: "18",
      category: "engineering",
    },
    {
      id: "9c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
      name: "Workshop and Technology",
      description: "Technical workshop skills and technology",
      schedule: "Mon-Fri 08:00-17:00",
      instructorId: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentIds: [],
      requiredEducationLevel: ["UACE", "Diploma"],
      requiredSubjects: ["Physics", "Mathematics"],
      minimumPoints: 7,
      passMark: 75,
      duration: "12",
      category: "technical",
    },
    {
      id: "0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
      name: "Technical Stores Course",
      description: "Technical inventory and stores management",
      schedule: "Mon-Fri 08:00-17:00",
      instructorId: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentIds: [],
      requiredEducationLevel: ["UACE", "Diploma"],
      requiredSubjects: ["Mathematics"],
      minimumPoints: 7,
      passMark: 75,
      duration: "6",
      category: "technical",
    },
    {
      id: "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
      name: "Flight Operations",
      description: "Flight operations and air traffic management",
      schedule: "Mon-Fri 08:00-17:00",
      instructorId: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentIds: [],
      requiredEducationLevel: ["UACE", "Diploma", "Degree"],
      requiredSubjects: ["Physics", "Mathematics"],
      minimumPoints: 7,
      passMark: 75,
      duration: "12",
      category: "operations",
    },
    {
      id: "2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f",
      name: "Fire and Safety",
      description: "Fire prevention and safety protocols",
      schedule: "Mon-Fri 08:00-17:00",
      instructorId: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentIds: [],
      requiredEducationLevel: ["UACE", "Diploma"],
      requiredSubjects: ["Physics"],
      minimumPoints: 7,
      passMark: 75,
      duration: "8",
      category: "safety",
    },
    {
      id: "3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a",
      name: "Basic Radar Course",
      description: "Radar systems and operations",
      schedule: "Mon-Fri 08:00-17:00",
      instructorId: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentIds: [],
      requiredEducationLevel: ["UACE", "Diploma", "Degree"],
      requiredSubjects: ["Physics", "Mathematics"],
      minimumPoints: 7,
      passMark: 75,
      duration: "10",
      category: "technical",
    },
  ],
  exams: [],
  grades: [],
  attendance: [],
  resources: [],
  schedules: [],
  examSubmissions: [],
  gradeCategories: [],
  courseGrades: [],
  gradeScales: [],
  transcripts: [],
  studentPerformances: [],
};

// Export just what we need for seeding
export { initialData };

export default {
  initialData,
};
