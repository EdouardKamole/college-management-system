-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    pin VARCHAR(4) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    -- Student specific fields
    date_of_birth DATE,
    home_district VARCHAR(255),
    student_tel_no VARCHAR(50),
    father_name VARCHAR(255),
    father_contact VARCHAR(50),
    mother_name VARCHAR(255),
    mother_contact VARCHAR(50),
    next_of_kin_name VARCHAR(255),
    next_of_kin_contact VARCHAR(50),
    education_level VARCHAR(20) CHECK (education_level IN ('UACE', 'Diploma', 'Degree', 'Master')),
    subject_combination TEXT[],
    total_points INTEGER,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    date_of_enrollment DATE,
    academic_status VARCHAR(20) CHECK (academic_status IN ('active', 'probation', 'suspended', 'graduated')),
    performance_prediction VARCHAR(20) CHECK (performance_prediction IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    schedule VARCHAR(255),
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    student_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    file_url TEXT,
    file_type VARCHAR(100),
    file_size BIGINT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    questions JSONB DEFAULT '[]',
    total_points INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 1,
    show_results BOOLEAN DEFAULT true,
    randomize_questions BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
    assignment_id UUID,
    category VARCHAR(20) NOT NULL CHECK (category IN ('exam', 'assignment', 'quiz', 'participation', 'project', 'final')),
    name VARCHAR(255) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 0,
    date DATE NOT NULL,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    feedback TEXT,
    late BOOLEAN DEFAULT false,
    excused BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_resources_course ON resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_exams_course ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id);
CREATE INDEX IF NOT EXISTS idx_grades_exam ON grades(exam_id);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id, date)
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_submissions table
CREATE TABLE IF NOT EXISTS exam_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_url TEXT,
    marks_awarded DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'submitted', 'graded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- Create grade_categories table
CREATE TABLE IF NOT EXISTS grade_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    color VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_grades table
CREATE TABLE IF NOT EXISTS course_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    semester VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    letter_grade VARCHAR(5) NOT NULL,
    gpa DECIMAL(3,2) NOT NULL,
    final_letter_grade VARCHAR(5),
    is_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id, semester, year)
);

-- Create grade_scales table
CREATE TABLE IF NOT EXISTS grade_scales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    scale JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    generated_date DATE NOT NULL,
    generated_by VARCHAR(255) NOT NULL,
    semesters JSONB NOT NULL,
    cumulative_gpa DECIMAL(3,2) NOT NULL,
    total_credits INTEGER NOT NULL,
    academic_standing VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_performances table with updated schema
CREATE TABLE IF NOT EXISTS student_performances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    weekly_tests JSONB DEFAULT '[]',
    monthly_tests JSONB DEFAULT '[]',
    module_exams JSONB DEFAULT '[]',
    overall_performance DECIMAL(5,2) DEFAULT 0,
    prediction_status VARCHAR(20) CHECK (prediction_status IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_performances_student ON student_performances(student_id);
CREATE INDEX IF NOT EXISTS idx_student_performances_course ON student_performances(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_course ON schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam ON exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student ON exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_categories_course ON grade_categories(course_id);
CREATE INDEX IF NOT EXISTS idx_course_grades_student ON course_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_course_grades_course ON course_grades(course_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_student ON transcripts(student_id);
