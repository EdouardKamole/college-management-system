// Load environment variables first
require('dotenv').config({ path: '.env.local' });

// Debug log environment variables
console.log('Environment Variables:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

// Validate required environment variables
const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('Please make sure you have a .env.local file in your project root with these variables.');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const { initialData } = require('../lib/data');

// Type definitions for better IntelliSense
interface SeedData {
  users: any[];
  courses: any[];
  exams: any[];
  grades: any[];
  attendance: any[];
  resources: any[];
  schedules: any[];
  examSubmissions: any[];
  gradeCategories: any[];
  courseGrades: any[];
  gradeScales: any[];
  transcripts: any[];
  studentPerformances: any[];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log('🚀 Starting database seeding...');
  
  try {
    // 1. Create tables if they don't exist
    await createTables();
    
    // 2. Clear existing data (optional, be careful in production)
    await clearExistingData();
    
    // 3. Seed data
    await seedData(initialData);
    
    console.log('✅ Database seeded successfully!');
  } catch (error: any) {
    console.error('❌ Error seeding database:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

async function createTables() {
  console.log('🛠️  Creating tables...');
  
  try {
    // Enable UUID extension if it doesn't exist
    const { error: uuidError } = await supabase.rpc('create_extension_if_not_exists', {
      extension_name: 'uuid-ossp'
    });
    
    if (uuidError) {
      console.warn('⚠️  Could not enable UUID extension (it might already exist):', uuidError.message);
    } else {
      console.log('✅ Enabled UUID extension');
    }
    
    // Create a function to execute SQL in batches
    const executeSql = async (sql: string) => {
      const statements = sql.split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const stmt of statements) {
        try {
          // Use the correct function name 'execute_sql' as suggested by the error
          const { error } = await supabase.rpc('execute_sql', { query: stmt });
          if (error) throw error;
        } catch (error) {
          console.error('Error executing statement:', stmt);
          throw error;
        }
      }
    };
    
    // Create tables SQL
    const createTablesSQL = `
      -- Drop existing tables if they exist
      DROP TABLE IF EXISTS exam_submissions CASCADE;
      DROP TABLE IF EXISTS grades CASCADE;
      DROP TABLE IF EXISTS attendance CASCADE;
      DROP TABLE IF EXISTS resources CASCADE;
      DROP TABLE IF EXISTS schedules CASCADE;
      DROP TABLE IF EXISTS exams CASCADE;
      DROP TABLE IF EXISTS grade_categories CASCADE;
      DROP TABLE IF EXISTS course_grades CASCADE;
      DROP TABLE IF EXISTS grade_scales CASCADE;
      DROP TABLE IF EXISTS transcripts CASCADE;
      DROP TABLE IF EXISTS student_performances CASCADE;
      DROP TABLE IF EXISTS courses CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      -- Create users table
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        pin VARCHAR(10) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        date_of_birth DATE,
        home_district VARCHAR(255),
        student_tel_no VARCHAR(20),
        father_name VARCHAR(255),
        father_contact VARCHAR(20),
        mother_name VARCHAR(255),
        mother_contact VARCHAR(20),
        next_of_kin_name VARCHAR(255),
        next_of_kin_contact VARCHAR(20),
        education_level VARCHAR(20) CHECK (education_level IN ('UACE', 'Diploma', 'Degree', 'Master')),
        subject_combination TEXT[],
        total_points INTEGER,
        course_id UUID,
        date_of_enrollment DATE,
        academic_status VARCHAR(20) DEFAULT 'active' CHECK (academic_status IN ('active', 'probation', 'suspended', 'graduated')),
        performance_prediction VARCHAR(20) CHECK (performance_prediction IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create courses table
      CREATE TABLE courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        schedule TEXT,
        instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        student_ids UUID[],
        required_education_level VARCHAR(20)[],
        required_subjects TEXT[],
        minimum_points INTEGER,
        pass_mark INTEGER,
        duration VARCHAR(50),
        category VARCHAR(50) CHECK (category IN ('technical', 'engineering', 'operations', 'safety')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Update users table to add foreign key to courses
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_course 
      FOREIGN KEY (course_id) 
      REFERENCES courses(id) 
      ON DELETE SET NULL;
      
      -- Create resources table
      CREATE TABLE resources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create exams table
      CREATE TABLE exams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time TIME,
        location VARCHAR(255),
        total_marks INTEGER,
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        duration INTEGER,
        total_points INTEGER,
        attempts INTEGER,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create grades table
      CREATE TABLE grades (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        score DECIMAL(10,2) NOT NULL,
        max_score DECIMAL(10,2) NOT NULL,
        weight DECIMAL(5,2) DEFAULT 100.00,
        date DATE NOT NULL,
        feedback TEXT,
        late BOOLEAN DEFAULT false,
        excused BOOLEAN DEFAULT false,
        category VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT valid_score CHECK (score <= max_score)
      );
      
      -- Create attendance table
      CREATE TABLE attendance (
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
      CREATE TABLE schedules (
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
      CREATE TABLE exam_submissions (
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
      CREATE TABLE grade_categories (
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
      CREATE TABLE course_grades (
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
      CREATE TABLE grade_scales (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        scale JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create transcripts table
      CREATE TABLE transcripts (
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
      
      -- Create student_performances table
      CREATE TABLE student_performances (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        weekly_tests JSONB DEFAULT '[]'::jsonb,
        monthly_tests JSONB DEFAULT '[]'::jsonb,
        module_exams JSONB DEFAULT '[]'::jsonb,
        overall_performance DECIMAL(5,2) DEFAULT 0,
        prediction_status VARCHAR(20) CHECK (prediction_status IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(student_id, course_id)
      );
      
      -- Create indexes for better performance
      CREATE INDEX idx_grades_student ON grades(student_id);
      CREATE INDEX idx_grades_course ON grades(course_id);
      CREATE INDEX idx_grades_exam ON grades(exam_id);
      CREATE INDEX idx_attendance_student ON attendance(student_id);
      CREATE INDEX idx_attendance_course ON attendance(course_id);
      CREATE INDEX idx_schedules_course ON schedules(course_id);
      CREATE INDEX idx_exam_submissions_exam ON exam_submissions(exam_id);
      CREATE INDEX idx_exam_submissions_student ON exam_submissions(student_id);
      CREATE INDEX idx_grade_categories_course ON grade_categories(course_id);
      CREATE INDEX idx_course_grades_student ON course_grades(student_id);
      CREATE INDEX idx_course_grades_course ON course_grades(course_id);
      CREATE INDEX idx_transcripts_student ON transcripts(student_id);
      CREATE INDEX idx_student_performances_student ON student_performances(student_id);
      CREATE INDEX idx_student_performances_course ON student_performances(course_id);
      
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
      
      CREATE TRIGGER update_resources_updated_at
      BEFORE UPDATE ON resources
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_exams_updated_at
      BEFORE UPDATE ON exams
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_grades_updated_at
      BEFORE UPDATE ON grades
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_attendance_updated_at
      BEFORE UPDATE ON attendance
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_schedules_updated_at
      BEFORE UPDATE ON schedules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_exam_submissions_updated_at
      BEFORE UPDATE ON exam_submissions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_grade_categories_updated_at
      BEFORE UPDATE ON grade_categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_course_grades_updated_at
      BEFORE UPDATE ON course_grades
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_grade_scales_updated_at
      BEFORE UPDATE ON grade_scales
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_transcripts_updated_at
      BEFORE UPDATE ON transcripts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_student_performances_updated_at
      BEFORE UPDATE ON student_performances
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    // Execute the SQL to create tables
    await executeSql(createTablesSQL);
    
    console.log('✅ Tables created successfully');
  } catch (error) {
    console.error('❌ Error in createTables:', error);
    throw error;
  }
}

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  try {
    // List of tables to clear (in reverse order of foreign key dependencies)
    const tables = [
      'transcripts',
      'student_performances',
      'course_grades',
      'grade_scales',
      'grade_categories',
      'exam_submissions',
      'grades',
      'exams',
      'attendance',
      'schedules',
      'resources',
      'courses',
      'users'
    ];

    for (const table of tables) {
      console.log(`🧹 Clearing ${table}...`);
      const { error } = await supabase.from(table).delete();
      
      if (error) {
        console.warn(`⚠️ Warning clearing ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    }
    
    console.log('✅ All tables cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing tables:', error);
    throw error;
  }
}

// Helper function to convert camelCase to snake_case
function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  return Object.keys(obj).reduce((acc: any, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const value = obj[key];
    
    if (value !== undefined) {
      acc[snakeKey] = toSnakeCase(value);
    }
    
    return acc;
  }, {});
}

async function seedData(data: SeedData) {
  console.log('🌱 Seeding data...');
  
  // Helper function to log errors consistently
  const logError = (entity: string, error: any) => {
    console.error(`❌ Error inserting ${entity}:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  };

  // Helper function to handle database insert operations
  const insertData = async (entity: string, table: string, items: any[], transformFn?: (item: any) => any) => {
    if (!items?.length) return;
    
    console.log(`📝 Seeding ${items.length} ${entity}...`);
    
    const itemsToInsert = transformFn 
      ? items.map(item => transformFn(item))
      : items;
    
    const { error } = await supabase
      .from(table)
      .insert(itemsToInsert);
      
    if (error) {
      logError(entity, error);
      throw error;
    }
    
    console.log(`✅ Seeded ${items.length} ${entity}`);
  };

  try {
    // First, seed admin and instructor users (without course references)
    const adminAndInstructors = data.users.filter(user => 
      user.role === 'admin' || user.role === 'instructor'
    );
    
    await insertData('admins and instructors', 'users', adminAndInstructors, (user) => ({
      ...toSnakeCase(user),
      course_id: null // No course reference for admins/instructors
    }));
    
    // Then seed courses (with instructor references)
    await insertData('courses', 'courses', data.courses, (course) => ({
      ...toSnakeCase(course),
      instructor_id: course.instructorId || null,
      student_ids: [] // We'll update this after creating students
    }));
    
    // Then seed students (with course references)
    const students = data.users.filter(user => user.role === 'student');
    await insertData('students', 'users', students, (user) => ({
      ...toSnakeCase(user),
      course_id: user.courseId || null
    }));
    
    // Now update courses with student IDs
    if (data.courses?.length > 0) {
      for (const course of data.courses) {
        if (course.studentIds?.length > 0) {
          await supabase
            .from('courses')
            .update({ student_ids: course.studentIds })
            .eq('id', course.id);
        }
      }
    }
    
    // Seed schedules
    await insertData('schedules', 'schedules', data.schedules, (schedule) => ({
      ...toSnakeCase(schedule),
      course_id: schedule.courseId,
      day_of_week: schedule.dayOfWeek,
      start_time: schedule.startTime,
      end_time: schedule.endTime
    }));
    
    // Seed exams
    await insertData('exams', 'exams', data.exams, (exam) => ({
      ...toSnakeCase(exam),
      course_id: exam.courseId,
      start_time: exam.startTime,
      end_time: exam.endTime,
      created_by: exam.createdBy
    }));
    
    // Seed exam submissions
    await insertData('exam submissions', 'exam_submissions', data.examSubmissions, (sub) => ({
      ...toSnakeCase(sub),
      exam_id: sub.examId,
      student_id: sub.studentId,
      submission_date: sub.submissionDate,
      file_url: sub.fileUrl,
      marks_awarded: sub.marksAwarded
    }));
    
    // Seed grade categories
    await insertData('grade categories', 'grade_categories', data.gradeCategories, (cat) => ({
      ...toSnakeCase(cat),
      course_id: cat.courseId
    }));
    
    // Seed course grades
    await insertData('course grades', 'course_grades', data.courseGrades, (grade) => ({
      ...toSnakeCase(grade),
      student_id: grade.studentId,
      course_id: grade.courseId,
      letter_grade: grade.letterGrade,
      final_letter_grade: grade.finalLetterGrade,
      is_complete: grade.isComplete
    }));
    
    // Seed grade scales
    await insertData('grade scales', 'grade_scales', data.gradeScales, toSnakeCase);
    
    // Seed transcripts
    await insertData('transcripts', 'transcripts', data.transcripts, (transcript) => ({
      ...toSnakeCase(transcript),
      student_id: transcript.studentId,
      generated_date: transcript.generatedDate,
      generated_by: transcript.generatedBy,
      cumulative_gpa: transcript.cumulativeGpa,
      total_credits: transcript.totalCredits,
      academic_standing: transcript.academicStanding
    }));
    
    // Seed student performances
    await insertData('student performances', 'student_performances', data.studentPerformances, (perf) => ({
      ...toSnakeCase(perf),
      student_id: perf.studentId,
      course_id: perf.courseId,
      prediction_status: perf.predictionStatus,
      last_updated: perf.lastUpdated
    }));
    
    console.log('🌱 All data seeded successfully');
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    throw error;
  }
}

// Run the seed function
// Handle promise
seedDatabase().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
