-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    dateOfBirth DATE,
    homeDistrict VARCHAR(100),
    studentTelNo VARCHAR(20),
    fatherName VARCHAR(100),
    fatherContact VARCHAR(20),
    motherName VARCHAR(100),
    motherContact VARCHAR(20),
    nextOfKinName VARCHAR(100),
    nextOfKinContact VARCHAR(20),
    educationLevel VARCHAR(20) CHECK (educationLevel IN ('UACE', 'Diploma', 'Degree', 'Master')),
    subjectCombination TEXT[],
    totalPoints INTEGER,
    courseId UUID,
    dateOfEnrollment DATE,
    academicStatus VARCHAR(20) CHECK (academicStatus IN ('active', 'probation', 'suspended', 'graduated')),
    performancePrediction VARCHAR(20) CHECK (performancePrediction IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    schedule VARCHAR(100) NOT NULL,
    instructorId UUID NOT NULL,
    requiredEducationLevel VARCHAR(20)[] NOT NULL,
    requiredSubjects TEXT[] NOT NULL,
    minimumPoints INTEGER NOT NULL,
    passMark INTEGER NOT NULL,
    duration VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('technical', 'engineering', 'operations', 'safety')),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructorId) REFERENCES users(id) ON DELETE RESTRICT
);

-- Course-Student junction table (for many-to-many relationship)
CREATE TABLE courseStudents (
    courseId UUID NOT NULL,
    studentId UUID NOT NULL,
    PRIMARY KEY (courseId, studentId),
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    options TEXT[],
    correctAnswer TEXT,
    points INTEGER NOT NULL,
    required BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courseId UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    totalMarks INTEGER NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    duration INTEGER NOT NULL,
    totalPoints INTEGER NOT NULL,
    attempts INTEGER NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Exam-Question junction table (for many-to-many relationship)
CREATE TABLE examQuestions (
    examId UUID NOT NULL,
    questionId UUID NOT NULL,
    PRIMARY KEY (examId, questionId),
    FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE
);

-- Grades table
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studentId UUID NOT NULL,
    courseId UUID NOT NULL,
    examId UUID,
    name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    maxScore INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    date DATE NOT NULL,
    feedback TEXT,
    late BOOLEAN NOT NULL,
    excused BOOLEAN NOT NULL,
    category VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE SET NULL
);

-- Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studentId UUID NOT NULL,
    courseId UUID NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courseId UUID NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    fileUrl VARCHAR(255) NOT NULL,
    uploadDate DATE NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courseId UUID NOT NULL,
    dayOfWeek VARCHAR(20) NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    location VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Exam Submissions table
CREATE TABLE examSubmissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examId UUID NOT NULL,
    studentId UUID NOT NULL,
    submissionDate DATE NOT NULL,
    fileUrl VARCHAR(255) NOT NULL,
    marksAwarded INTEGER,
    status VARCHAR(20) NOT NULL CHECK (status IN ('in-progress', 'submitted', 'graded')),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE
);

-- Grade Categories table
CREATE TABLE gradeCategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courseId UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    weight INTEGER NOT NULL,
    color VARCHAR(20) NOT NULL,
    description TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Course Grades table
CREATE TABLE courseGrades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studentId UUID NOT NULL,
    courseId UUID NOT NULL,
    semester VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    letterGrade VARCHAR(2) NOT NULL,
    gpa NUMERIC(3,2) NOT NULL,
    finalLetterGrade VARCHAR(2),
    isComplete BOOLEAN NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Grade Scales table
CREATE TABLE gradeScales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grade Scale Items table
CREATE TABLE gradeScaleItems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gradeScaleId UUID NOT NULL,
    letter VARCHAR(2) NOT NULL,
    minPercentage INTEGER NOT NULL,
    maxPercentage INTEGER NOT NULL,
    gpaPoints NUMERIC(3,2) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gradeScaleId) REFERENCES gradeScales(id) ON DELETE CASCADE
);

-- Transcripts table
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studentId UUID NOT NULL,
    generatedDate DATE NOT NULL,
    generatedBy UUID NOT NULL,
    cumulativeGpa NUMERIC(3,2) NOT NULL,
    totalCredits INTEGER NOT NULL,
    academicStanding VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (generatedBy) REFERENCES users(id) ON DELETE RESTRICT
);

-- Transcript Semesters table
CREATE TABLE transcriptSemesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcriptId UUID NOT NULL,
    semester VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    semesterGpa NUMERIC(3,2) NOT NULL,
    semesterCredits INTEGER NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transcriptId) REFERENCES transcripts(id) ON DELETE CASCADE
);

-- Transcript Semester Courses table
CREATE TABLE transcriptSemesterCourses (
    transcriptSemesterId UUID NOT NULL,
    courseId UUID NOT NULL,
    courseGradeId UUID NOT NULL,
    PRIMARY KEY (transcriptSemesterId, courseGradeId),
    FOREIGN KEY (transcriptSemesterId) REFERENCES transcriptSemesters(id) ON DELETE CASCADE,
    FOREIGN KEY (courseGradeId) REFERENCES courseGrades(id) ON DELETE CASCADE
);

-- Student Performances table
CREATE TABLE studentPerformances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studentId UUID NOT NULL,
    courseId UUID NOT NULL,
    overallPerformance INTEGER NOT NULL,
    predictionStatus VARCHAR(20) NOT NULL CHECK (predictionStatus IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
    lastUpdated DATE NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Weekly Tests table
CREATE TABLE weeklyTests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studentPerformanceId UUID NOT NULL,
    week INTEGER NOT NULL,
    score INTEGER NOT NULL,
    maxScore INTEGER NOT NULL,
    date DATE NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentPerformanceId) REFERENCES studentPerformances(id) ON DELETE CASCADE
);

-- Monthly Tests table
CREATE TABLE monthlyTests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studentPerformanceId UUID NOT NULL,
    month INTEGER NOT NULL,
    score INTEGER NOT NULL,
    maxScore INTEGER NOT NULL,
    date DATE NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentPerformanceId) REFERENCES studentPerformances(id) ON DELETE CASCADE
);

-- Module Exams table
CREATE TABLE moduleExams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studentPerformanceId UUID NOT NULL,
    moduleId UUID NOT NULL,
    score INTEGER NOT NULL,
    maxScore INTEGER NOT NULL,
    date DATE NOT NULL,
    passed BOOLEAN NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentPerformanceId) REFERENCES studentPerformances(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idxUsersRole ON users(role);
CREATE INDEX idxUsersEmail ON users(email);
CREATE INDEX idxCoursesInstructorId ON courses(instructorId);
CREATE INDEX idxExamsCourseId ON exams(courseId);
CREATE INDEX idxGradesStudentId ON grades(studentId);
CREATE INDEX idxGradesCourseId ON grades(courseId);
CREATE INDEX idxAttendanceStudentId ON attendance(studentId);
CREATE INDEX idxAttendanceCourseId ON attendance(courseId);
CREATE INDEX idxResourcesCourseId ON resources(courseId);
CREATE INDEX idxSchedulesCourseId ON schedules(courseId);
CREATE INDEX idxExamSubmissionsExamId ON examSubmissions(examId);
CREATE INDEX idxExamSubmissionsStudentId ON examSubmissions(studentId);
CREATE INDEX idxGradeCategoriesCourseId ON gradeCategories(courseId);
CREATE INDEX idxCourseGradesStudentId ON courseGrades(studentId);
CREATE INDEX idxCourseGradesCourseId ON courseGrades(courseId);
CREATE INDEX idxTranscriptsStudentId ON transcripts(studentId);
CREATE INDEX idxStudentPerformancesStudentId ON studentPerformances(studentId);
CREATE INDEX idxStudentPerformancesCourseId ON studentPerformances(courseId);

-- Create trigger for updating updatedAt timestamp
CREATE OR REPLACE FUNCTION updateTimestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER updateUsersTimestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateCoursesTimestamp
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateQuestionsTimestamp
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateExamsTimestamp
    BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateGradesTimestamp
    BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateAttendanceTimestamp
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateResourcesTimestamp
    BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateSchedulesTimestamp
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateExamSubmissionsTimestamp
    BEFORE UPDATE ON examSubmissions
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateGradeCategoriesTimestamp
    BEFORE UPDATE ON gradeCategories
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateCourseGradesTimestamp
    BEFORE UPDATE ON courseGrades
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateGradeScalesTimestamp
    BEFORE UPDATE ON gradeScales
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateGradeScaleItemsTimestamp
    BEFORE UPDATE ON gradeScaleItems
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateTranscriptsTimestamp
    BEFORE UPDATE ON transcripts
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateTranscriptSemestersTimestamp
    BEFORE UPDATE ON transcriptSemesters
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateStudentPerformancesTimestamp
    BEFORE UPDATE ON studentPerformances
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateWeeklyTestsTimestamp
    BEFORE UPDATE ON weeklyTests
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateMonthlyTestsTimestamp
    BEFORE UPDATE ON monthlyTests
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();

CREATE TRIGGER updateModuleExamsTimestamp
    BEFORE UPDATE ON moduleExams
    FOR EACH ROW EXECUTE FUNCTION updateTimestamp();