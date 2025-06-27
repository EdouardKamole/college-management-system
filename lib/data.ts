export interface User {
  id: string;
  username: string;
  password: string;
  pin: string;
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
  courseid?: string;
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
  courseId: string;
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
  weight: number; // percentage weight in final grade
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
      dateofbirth: "2000-05-15",
      homedistrict: "Kampala",
      studenttelno: "+256701234567",
      fathername: "Robert Brown",
      fathercontact: "+256701234568",
      mothername: "Mary Brown",
      mothercontact: "+256701234569",
      nextofkinname: "John Brown",
      nextofkincontact: "+256701234570",
      educationlevel: "UACE" as const,
      subjectcombination: ["Physics", "Chemistry", "Mathematics"],
      totalpoints: 15,
      courseid: "69f7c8d0-8e3f-6a5b-1c2d-3e4f5a6b7c8d",
      dateofenrollment: "2024-01-15",
      academicstatus: "active" as const,
      performanceprediction: "good" as const,
    },
  ],
  courses: [
    {
      id: "69f7c8d0-8e3f-6a5b-1c2d-3e4f5a6b7c8d",
      name: "Piloting Course",
      description: "Comprehensive pilot training program",
      schedule: "Mon-Fri 08:00-17:00",
      instructorid: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentids: ["58e6b4c9-7d3e-5f2a-0b4c-9e1f2a3b4c5d"],
      requirededucationlevel: ["UACE", "Diploma", "Degree"],
      requiredsubjects: ["Physics", "Mathematics"],
      minimumpoints: 7,
      passmark: 75,
      duration: "24",
      category: "operations",
    },
    {
      id: "7a08d9e1-9f4a-7b6c-2d3e-4f5a6b7c8d9e",
      name: "Electrical Engineering Course",
      description: "Electrical systems and engineering principles",
      schedule: "Mon-Fri 08:00-17:00",
      instructorid: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentids: [],
      requirededucationlevel: ["UACE", "Diploma", "Degree"],
      requiredsubjects: ["Physics", "Mathematics"],
      minimumpoints: 7,
      passmark: 75,
      duration: "18",
      category: "engineering",
    },
    {
      id: "8b1c9d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e",
      name: "Mechanical Engineering Course",
      description: "Mechanical systems and maintenance",
      schedule: "Mon-Fri 08:00-17:00",
      instructorid: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentids: [],
      requirededucationlevel: ["UACE", "Diploma", "Degree"],
      requiredsubjects: ["Physics", "Mathematics"],
      minimumpoints: 7,
      passmark: 75,
      duration: "18",
      category: "engineering",
    },
    {
      id: "9c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
      name: "Workshop and Technology",
      description: "Technical workshop skills and technology",
      schedule: "Mon-Fri 08:00-17:00",
      instructorid: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentids: [],
      requirededucationlevel: ["UACE", "Diploma"],
      requiredsubjects: ["Physics", "Mathematics"],
      minimumpoints: 7,
      passmark: 75,
      duration: "12",
      category: "technical",
    },
    {
      id: "0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
      name: "Technical Stores Course",
      description: "Technical inventory and stores management",
      schedule: "Mon-Fri 08:00-17:00",
      instructorid: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentids: [],
      requirededucationlevel: ["UACE", "Diploma"],
      requiredsubjects: ["Mathematics"],
      minimumpoints: 7,
      passmark: 75,
      duration: "6",
      category: "technical",
    },
    {
      id: "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
      name: "Flight Operations",
      description: "Flight operations and air traffic management",
      schedule: "Mon-Fri 08:00-17:00",
      instructorid: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentids: [],
      requirededucationlevel: ["UACE", "Diploma", "Degree"],
      requiredsubjects: ["Physics", "Mathematics"],
      minimumpoints: 7,
      passmark: 75,
      duration: "12",
      category: "operations",
    },
    {
      id: "2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f",
      name: "Fire and Safety",
      description: "Fire prevention and safety protocols",
      schedule: "Mon-Fri 08:00-17:00",
      instructorid: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentids: [],
      requirededucationlevel: ["UACE", "Diploma"],
      requiredsubjects: ["Physics"],
      minimumpoints: 7,
      passmark: 75,
      duration: "8",
      category: "safety",
    },
    {
      id: "3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a",
      name: "Basic Radar Course",
      description: "Radar systems and operations",
      schedule: "Mon-Fri 08:00-17:00",
      instructorid: "47f5a3b8-6c2d-4e1f-9a3b-8d9e0f1a2b3c",
      studentids: [],
      requirededucationlevel: ["UACE", "Diploma", "Degree"],
      requiredsubjects: ["Physics", "Mathematics"],
      minimumpoints: 7,
      passmark: 75,
      duration: "10",
      category: "technical",
    },
  ],
  exams: [],
  grades: [],
  attendance: [],
  resources: [],
  schedules: [],
  examsubmissions: [],
  gradecategories: [],
  coursegrades: [],
  gradescales: [],
  transcripts: [],
  studentperformances: [],
};

// Export just what we need for seeding
export { initialData };

export default {
  initialData,
};
