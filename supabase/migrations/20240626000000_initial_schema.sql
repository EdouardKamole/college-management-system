-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS exam_submissions CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  date_of_birth DATE,
  home_district TEXT,
  student_tel_no TEXT,
  father_name TEXT,
  father_contact TEXT,
  mother_name TEXT,
  mother_contact TEXT,
  next_of_kin_name TEXT,
  next_of_kin_contact TEXT,
  education_level TEXT CHECK (education_level IN ('UACE', 'Diploma', 'Degree', 'Master')),
  subject_combination TEXT[],
  total_points INTEGER,
  course_id UUID,
  date_of_enrollment DATE,
  academic_status TEXT CHECK (academic_status IN ('active', 'probation', 'suspended', 'graduated')),
  performance_prediction TEXT CHECK (performance_prediction IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT,
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  student_ids UUID[],
  required_education_level TEXT[],
  required_subjects TEXT[],
  minimum_points INTEGER,
  pass_mark INTEGER,
  duration TEXT,
  category TEXT CHECK (category IN ('technical', 'engineering', 'operations', 'safety')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
