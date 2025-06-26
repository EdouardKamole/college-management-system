import { createClient } from '@supabase/supabase-js';
import { initialData, User } from '../lib/data';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

// Type definitions for better IntelliSense (using provided interfaces)
interface SeedData {
  users: User[];
  courses: any[];
  exams: any[];
  grades: any[];
  attendance: any[];
  resources: any[];
  schedules: any[];
  examsubmissions: any[];
  gradecategories: any[];
  coursegrades: any[];
  gradescales: any[];
  transcripts: any[];
  studentperformances: any[];
}

// Hash password function
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
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
    // Log sanitized user data for debugging
    console.log('📋 Initial users data:', 
      initialData.users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        pin: user.pin ? '****' : null // Hide sensitive data
      }))
    );

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
  console.log('🛠️ Creating tables...');
  
  try {
    // Enable UUID extension if it doesn't exist
    const { error: uuidError } = await supabase.rpc('create_extension_if_not_exists', {
      extension_name: 'uuid-ossp'
    });
    
    if (uuidError) {
      console.warn('⚠️ Could not enable UUID extension (it might already exist):', uuidError.message);
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
          const { error } = await supabase.rpc('execute_sql', { query: stmt });
          if (error) throw error;
        } catch (error) {
          console.error('Error executing statement:', stmt);
          throw error;
        }
      }
    };
    
    // Create tables SQL (lowercase schema)
    const createTablesSQL = `
      -- Drop existing tables if they exist (in reverse order of dependencies)
      DROP TABLE IF EXISTS transcriptsemestercourses CASCADE;
      DROP TABLE IF EXISTS transcriptsemesters CASCADE;
      DROP TABLE IF EXISTS weeklytests CASCADE;
      DROP TABLE IF EXISTS monthlytests CASCADE;
      DROP TABLE IF EXISTS moduleexams CASCADE;
      DROP TABLE IF EXISTS studentperformances CASCADE;
      DROP TABLE IF EXISTS transcripts CASCADE;
      DROP TABLE IF EXISTS gradescaleitems CASCADE;
      DROP TABLE IF EXISTS gradescales CASCADE;
      DROP TABLE IF EXISTS coursegrades CASCADE;
      DROP TABLE IF EXISTS gradecategories CASCADE;
      DROP TABLE IF EXISTS examsubmissions CASCADE;
      DROP TABLE IF EXISTS grades CASCADE;
      DROP TABLE IF EXISTS examquestions CASCADE;
      DROP TABLE IF EXISTS exams CASCADE;
      DROP TABLE IF EXISTS schedules CASCADE;
      DROP TABLE IF EXISTS resources CASCADE;
      DROP TABLE IF EXISTS attendance CASCADE;
      DROP TABLE IF EXISTS coursestudents CASCADE;
      DROP TABLE IF EXISTS questions CASCADE;
      DROP TABLE IF EXISTS courses CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      -- Create users table
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        pin VARCHAR(10) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        dateofbirth DATE,
        homedistrict VARCHAR(100),
        studenttelno VARCHAR(20),
        fathername VARCHAR(100),
        fathercontact VARCHAR(20),
        mothername VARCHAR(100),
        mothercontact VARCHAR(20),
        nextofkinname VARCHAR(100),
        nextofkincontact VARCHAR(20),
        educationlevel VARCHAR(20) CHECK (educationlevel IN ('UACE', 'Diploma', 'Degree', 'Master')),
        subjectcombination TEXT[],
        totalpoints INTEGER,
        courseid UUID,
        dateofenrollment DATE,
        academicstatus VARCHAR(20) CHECK (academicstatus IN ('active', 'probation', 'suspended', 'graduated')),
        performanceprediction VARCHAR(20) CHECK (performanceprediction IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create courses table
      CREATE TABLE courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        schedule VARCHAR(100) NOT NULL,
        instructorid UUID NOT NULL,
        requirededucationlevel VARCHAR(20)[] NOT NULL,
        requiredsubjects TEXT[] NOT NULL,
        minimumpoints INTEGER NOT NULL,
        passmark INTEGER NOT NULL,
        duration VARCHAR(50) NOT NULL,
        category VARCHAR(20) NOT NULL CHECK (category IN ('technical', 'engineering', 'operations', 'safety')),
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (instructorid) REFERENCES users(id) ON DELETE RESTRICT
      );

      -- Create coursestudents junction table
      CREATE TABLE coursestudents (
        courseid UUID NOT NULL,
        studentid UUID NOT NULL,
        PRIMARY KEY (courseid, studentid),
        FOREIGN KEY (courseid) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (studentid) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Create questions table
      CREATE TABLE questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(50) NOT NULL,
        question TEXT NOT NULL,
        options TEXT[],
        correctanswer TEXT,
        points INTEGER NOT NULL,
        required BOOLEAN DEFAULT false,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create exams table
      CREATE TABLE exams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        courseid UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        time VARCHAR(50) NOT NULL,
        location VARCHAR(100) NOT NULL,
        totalmarks INTEGER NOT NULL,
        starttime TIME NOT NULL,
        endtime TIME NOT NULL,
        duration INTEGER NOT NULL,
        totalpoints INTEGER NOT NULL,
        attempts INTEGER NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseid) REFERENCES courses(id) ON DELETE CASCADE
      );

      -- Create examquestions junction table
      CREATE TABLE examquestions (
        examid UUID NOT NULL,
        questionid UUID NOT NULL,
        PRIMARY KEY (examid, questionid),
        FOREIGN KEY (examid) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (questionid) REFERENCES questions(id) ON DELETE CASCADE
      );

      -- Create grades table
      CREATE TABLE grades (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        studentid UUID NOT NULL,
        courseid UUID NOT NULL,
        examid UUID,
        name VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL,
        maxscore INTEGER NOT NULL,
        weight INTEGER NOT NULL,
        date DATE NOT NULL,
        feedback TEXT,
        islate BOOLEAN NOT NULL,
        isexcused BOOLEAN NOT NULL,
        category VARCHAR(100) NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentid) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (courseid) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (examid) REFERENCES exams(id) ON DELETE SET NULL
      );

      -- Create attendance table
      CREATE TABLE attendance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        studentid UUID NOT NULL,
        courseid UUID NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentid) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (courseid) REFERENCES courses(id) ON DELETE CASCADE
      );

      -- Create resources table
      CREATE TABLE resources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        courseid UUID NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        fileurl VARCHAR(255) NOT NULL,
        uploaddate DATE NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseid) REFERENCES courses(id) ON DELETE CASCADE
      );

      -- Create schedules table
      CREATE TABLE schedules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        courseid UUID NOT NULL,
        dayofweek VARCHAR(20) NOT NULL,
        starttime TIME NOT NULL,
        endtime TIME NOT NULL,
        location VARCHAR(100) NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseid) REFERENCES courses(id) ON DELETE CASCADE
      );

      -- Create examsubmissions table
      CREATE TABLE examsubmissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        examid UUID NOT NULL,
        studentid UUID NOT NULL,
        submissiondate DATE NOT NULL,
        fileurl VARCHAR(255) NOT NULL,
        marksawarded INTEGER,
        status VARCHAR(20) NOT NULL CHECK (status IN ('in-progress', 'submitted', 'graded')),
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (examid) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (studentid) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Create gradecategories table
      CREATE TABLE gradecategories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        courseid UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        weight INTEGER NOT NULL,
        color VARCHAR(20) NOT NULL,
        description TEXT,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseid) REFERENCES courses(id) ON DELETE CASCADE
      );

      -- Create coursegrades table
      CREATE TABLE coursegrades (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        studentid UUID NOT NULL,
        courseid UUID NOT NULL,
        semester VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        credits INTEGER NOT NULL,
        percentage INTEGER NOT NULL,
        lettergrade VARCHAR(2) NOT NULL,
        gpa NUMERIC(3,2) NOT NULL,
        finallettergrade VARCHAR(2),
        iscomplete BOOLEAN NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentid) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (courseid) REFERENCES courses(id) ON DELETE CASCADE
      );

      -- Create gradescales table
      CREATE TABLE gradescales (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create gradescaleitems table
      CREATE TABLE gradescaleitems (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        gradescaleid UUID NOT NULL,
        letter VARCHAR(2) NOT NULL,
        minpercentage INTEGER NOT NULL,
        maxpercentage INTEGER NOT NULL,
        gpapoints NUMERIC(3,2) NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gradescaleid) REFERENCES gradescales(id) ON DELETE CASCADE
      );

      -- Create transcripts table
      CREATE TABLE transcripts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        studentid UUID NOT NULL,
        generateddate DATE NOT NULL,
        generatedby UUID NOT NULL,
        cumulativegpa NUMERIC(3,2) NOT NULL,
        totalcredits INTEGER NOT NULL,
        academicstanding VARCHAR(50) NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentid) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (generatedby) REFERENCES users(id) ON DELETE RESTRICT
      );

      -- Create transcriptsemesters table
      CREATE TABLE transcriptsemesters (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transcriptid UUID NOT NULL,
        semester VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        semestergpa NUMERIC(3,2) NOT NULL,
        semestercredits INTEGER NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transcriptid) REFERENCES transcripts(id) ON DELETE CASCADE
      );

      -- Create transcriptsemestercourses junction table
      CREATE TABLE transcriptsemestercourses (
        transcriptsemesterid UUID NOT NULL,
        coursegradeid UUID NOT NULL,
        PRIMARY KEY (transcriptsemesterid, coursegradeid),
        FOREIGN KEY (transcriptsemesterid) REFERENCES transcriptsemesters(id) ON DELETE CASCADE,
        FOREIGN KEY (coursegradeid) REFERENCES coursegrades(id) ON DELETE CASCADE
      );

      -- Create studentperformances table
      CREATE TABLE studentperformances (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        studentid UUID NOT NULL,
        courseid UUID NOT NULL,
        overallperformance INTEGER NOT NULL,
        predictionstatus VARCHAR(20) NOT NULL CHECK (predictionstatus IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
        lastupdated DATE NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentid) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (courseid) REFERENCES courses(id) ON DELETE CASCADE
      );

      -- Create weeklytests table
      CREATE TABLE weeklytests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        studentperformanceid UUID NOT NULL,
        week INTEGER NOT NULL,
        score INTEGER NOT NULL,
        maxscore INTEGER NOT NULL,
        date DATE NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentperformanceid) REFERENCES studentperformances(id) ON DELETE CASCADE
      );

      -- Create monthlytests table
      CREATE TABLE monthlytests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        studentperformanceid UUID NOT NULL,
        month INTEGER NOT NULL,
        score INTEGER NOT NULL,
        maxscore INTEGER NOT NULL,
        date DATE NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentperformanceid) REFERENCES studentperformances(id) ON DELETE CASCADE
      );

      -- Create moduleexams table
      CREATE TABLE moduleexams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        studentperformanceid UUID NOT NULL,
        moduleid UUID NOT NULL,
        score INTEGER NOT NULL,
        maxscore INTEGER NOT NULL,
        date DATE NOT NULL,
        passed BOOLEAN NOT NULL,
        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentperformanceid) REFERENCES studentperformances(id) ON DELETE CASCADE
      );

      -- Create indexes for better performance
      CREATE INDEX idx_users_role ON users(role);
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_courses_instructorid ON courses(instructorid);
      CREATE INDEX idx_exams_courseid ON exams(courseid);
      CREATE INDEX idx_grades_studentid ON grades(studentid);
      CREATE INDEX idx_grades_courseid ON grades(courseid);
      CREATE INDEX idx_attendance_studentid ON attendance(studentid);
      CREATE INDEX idx_attendance_courseid ON attendance(courseid);
      CREATE INDEX idx_resources_courseid ON resources(courseid);
      CREATE INDEX idx_schedules_courseid ON schedules(courseid);
      CREATE INDEX idx_examsubmissions_examid ON examsubmissions(examid);
      CREATE INDEX idx_examsubmissions_studentid ON examsubmissions(studentid);
      CREATE INDEX idx_gradecategories_courseid ON gradecategories(courseid);
      CREATE INDEX idx_coursegrades_studentid ON coursegrades(studentid);
      CREATE INDEX idx_coursegrades_courseid ON coursegrades(courseid);
      CREATE INDEX idx_transcripts_studentid ON transcripts(studentid);
      CREATE INDEX idx_studentperformances_studentid ON studentperformances(studentid);
      CREATE INDEX idx_studentperformances_courseid ON studentperformances(courseid);

      -- Create trigger function for updating updatedat timestamp
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updatedat = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create triggers for updatedat
      CREATE TRIGGER update_users_timestamp
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_courses_timestamp
        BEFORE UPDATE ON courses
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_questions_timestamp
        BEFORE UPDATE ON questions
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_exams_timestamp
        BEFORE UPDATE ON exams
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_grades_timestamp
        BEFORE UPDATE ON grades
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_attendance_timestamp
        BEFORE UPDATE ON attendance
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_resources_timestamp
        BEFORE UPDATE ON resources
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_schedules_timestamp
        BEFORE UPDATE ON schedules
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_examsubmissions_timestamp
        BEFORE UPDATE ON examsubmissions
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_gradecategories_timestamp
        BEFORE UPDATE ON gradecategories
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_coursegrades_timestamp
        BEFORE UPDATE ON coursegrades
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_gradescales_timestamp
        BEFORE UPDATE ON gradescales
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_gradescaleitems_timestamp
        BEFORE UPDATE ON gradescaleitems
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_transcripts_timestamp
        BEFORE UPDATE ON transcripts
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_transcriptsemesters_timestamp
        BEFORE UPDATE ON transcriptsemesters
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_studentperformances_timestamp
        BEFORE UPDATE ON studentperformances
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_weeklytests_timestamp
        BEFORE UPDATE ON weeklytests
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_monthlytests_timestamp
        BEFORE UPDATE ON monthlytests
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

      CREATE TRIGGER update_moduleexams_timestamp
        BEFORE UPDATE ON moduleexams
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
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
      'transcriptsemestercourses',
      'transcriptsemesters',
      'weeklytests',
      'monthlytests',
      'moduleexams',
      'studentperformances',
      'transcripts',
      'gradescaleitems',
      'gradescales',
      'coursegrades',
      'gradecategories',
      'examsubmissions',
      'grades',
      'examquestions',
      'exams',
      'attendance',
      'schedules',
      'resources',
      'coursestudents',
      'questions',
      'courses',
      'users'
    ];

    for (const table of tables) {
      console.log(`🧹 Clearing ${table}...`);
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
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

// Helper function to validate user data
function validateUser(user: User): { isValid: boolean; errors: string[]; validatedUser: User } {
  const requiredFields: (keyof User)[] = ['username', 'password', 'pin', 'role', 'name', 'email'];
  const errors: string[] = [];

  requiredFields.forEach(field => {
    const value = user[field];
    if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`Missing or empty required field: ${field}`);
    }
  });

  // Additional validation
  if (user.username && user.username.length > 50) {
    errors.push('Username must be 50 characters or less');
  }
  if (user.email && user.email.length > 100) {
    errors.push('Email must be 100 characters or less');
  }
  if (user.name && user.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }
  if (user.pin && user.pin.length > 10) {
    errors.push('Pin must be 10 characters or less');
  }
  if (user.role && !['admin', 'instructor', 'student'].includes(user.role)) {
    errors.push('Invalid role value');
  }

  // Create a validated user object with defaults
  const validatedUser: User = {
    id: user.id || uuidv4(),
    username: user.username || `user_${uuidv4().slice(0, 8)}`,
    password: user.password || 'defaultPass123',
    pin: user.pin || '0000',
    role: user.role || 'admin',
    name: user.name || 'Unknown User',
    email: user.email || `unknown_${uuidv4().slice(0, 8)}@example.com`,
    dateofbirth: user.dateofbirth || undefined,
    homedistrict: user.homedistrict || undefined,
    studenttelno: user.studenttelno || undefined,
    fathername: user.fathername || undefined,
    fathercontact: user.fathercontact || undefined,
    mothername: user.mothername || undefined,
    mothercontact: user.mothercontact || undefined,
    nextofkinname: user.nextofkinname || undefined,
    nextofkincontact: user.nextofkincontact || undefined,
    educationlevel: user.educationlevel || undefined,
    subjectcombination: user.subjectcombination || undefined,
    totalpoints: user.totalpoints || undefined,
    courseid: user.courseid || undefined,
    dateofenrollment: user.dateofenrollment || undefined,
    academicstatus: user.academicstatus || undefined,
    performanceprediction: user.performanceprediction || undefined
  };

  return {
    isValid: errors.length === 0,
    errors,
    validatedUser
  };
}

// Helper function to transform data for database
function transformToDbFormat(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => transformToDbFormat(item));
  }
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key.toLowerCase()] = transformToDbFormat(value);
    }
  }
  return result;
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
    if (!items?.length) {
      console.log(`ℹ️ No ${entity} to seed`);
      return;
    }
    
    console.log(`📝 Seeding ${items.length} ${entity}...`);
    
    // Process items with transform function if provided
    let itemsToInsert: any[] = [];
    if (transformFn) {
      // Process items one by one to catch any transformation errors
      for (const item of items) {
        try {
          const transformed = await transformFn(item);
          if (transformed) {
            itemsToInsert.push(transformed);
          }
        } catch (error) {
          console.error(`❌ Error transforming ${entity} item:`, error);
          throw error;
        }
      }
    } else {
      itemsToInsert = [...items];
    }
    
    // Validate required fields before insertion
    const invalidItems = itemsToInsert.filter(item => {
      if (table === 'users') {
        return !item.username || !item.email || !item.role;
      }
      return false;
    });
    
    if (invalidItems.length > 0) {
      console.error(`❌ Found ${invalidItems.length} invalid items with missing required fields`);
      throw new Error(`Cannot insert ${invalidItems.length} invalid items with missing required fields`);
    }
    
    // Log the data being inserted for debugging
    console.log(`📋 ${entity} to insert (first 2 items):`, 
      itemsToInsert.slice(0, 2).map((item: any) => {
        const logItem: any = { id: item.id };
        if (table === 'users') {
          logItem.username = item.username;
          logItem.role = item.role;
          logItem.name = item.name;
          logItem.email = item.email;
          logItem.pin = item.pin ? '****' : null;
        }
        return logItem;
      })
    );
    
    // Insert in chunks to avoid hitting any size limits
    const chunkSize = 50;
    for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
      const chunk = itemsToInsert.slice(i, i + chunkSize);
      console.log(`  Inserting chunk ${i / chunkSize + 1} of ${Math.ceil(itemsToInsert.length / chunkSize)} (${chunk.length} items)`);
      
      const { error } = await supabase
        .from(table)
        .insert(chunk);
        
      if (error) {
        logError(entity, error);
        console.error('Failed chunk:', chunk);
        throw error;
      }
    }
    
    console.log(`✅ Seeded ${itemsToInsert.length} ${entity}`);
  };

  try {
    // Seed admin and instructor users
    const adminAndInstructors = data.users
      .filter(user => user && (user.role === 'admin' || user.role === 'instructor'))
      .map(user => {
        console.log(`📋 Validating admin/instructor user (ID: ${user.id}):`, {
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          pin: user.pin ? '****' : null
        });
        
        const { isValid, errors, validatedUser } = validateUser(user);
        if (!isValid) {
          console.warn(`⚠️ Invalid admin/instructor user (ID: ${user.id}):`, errors, user);
        }
        return validatedUser;
      });
    
    await insertData('admins and instructors', 'users', adminAndInstructors, async (user) => {
      const transformedUser = transformToDbFormat({
        ...user,
        password: await hashPassword(user.password),
        courseid: null // No course reference for admins/instructors
      });
      console.log(`📋 Transformed admin/instructor user (ID: ${user.id}):`, {
        id: transformedUser.id,
        username: transformedUser.username,
        role: transformedUser.role,
        name: transformedUser.name,
        email: transformedUser.email,
        pin: transformedUser.pin ? '****' : null
      });
      return transformedUser;
    });
    
    // Seed courses
    await insertData('courses', 'courses', data.courses, (course) => ({
      id: course.id,
      name: course.name || 'Unnamed Course',
      description: course.description || '',
      schedule: course.schedule || '',
      instructorid: course.instructorid || course.instructorId,
      requirededucationlevel: course.requirededucationlevel || course.requiredEducationLevel || [],
      requiredsubjects: course.requiredsubjects || course.requiredSubjects || [],
      minimumpoints: course.minimumpoints || course.minimumPoints || 0,
      passmark: course.passmark || course.passMark || 50,
      duration: course.duration || '3 months',
      category: course.category || 'technical',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));
    
    // Seed students
    const students = data.users
      .filter(user => user && user.role === 'student')
      .map(user => {
        console.log(`📋 Validating student user (ID: ${user.id}):`, {
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          pin: user.pin ? '****' : null
        });
        
        const { isValid, errors, validatedUser } = validateUser(user);
        if (!isValid) {
          console.warn(`⚠️ Invalid student user (ID: ${user.id}):`, errors, user);
        }
        return validatedUser;
      });
    
    await insertData('students', 'users', students, async (user) => {
      const transformedUser = transformToDbFormat({
        id: user.id,
        username: user.username,
        password: await hashPassword(user.password),
        pin: user.pin,
        role: user.role,
        name: user.name,
        email: user.email,
        dateofbirth: user.dateofbirth || user.dateOfBirth ? new Date(user.dateofbirth || user.dateOfBirth).toISOString().split('T')[0] : null,
        homedistrict: user.homedistrict || user.homeDistrict || null,
        studenttelno: user.studenttelno || user.studentTelNo || null,
        fathername: user.fathername || user.fatherName || null,
        fathercontact: user.fathercontact || user.fatherContact || null,
        mothername: user.mothername || user.motherName || null,
        mothercontact: user.mothercontact || user.motherContact || null,
        nextofkinname: user.nextofkinname || user.nextOfKinName || null,
        nextofkincontact: user.nextofkincontact || user.nextOfKinContact || null,
        educationlevel: user.educationlevel || user.educationLevel || null,
        subjectcombination: user.subjectcombination || user.subjectCombination || [],
        totalpoints: user.totalpoints || user.totalPoints || 0,
        courseid: user.courseid || user.courseId || null,
        dateofenrollment: user.dateofenrollment || user.dateOfEnrollment ? new Date(user.dateofenrollment || user.dateOfEnrollment).toISOString().split('T')[0] : null,
        academicstatus: user.academicstatus || user.academicStatus || 'active',
        performanceprediction: user.performanceprediction || user.performancePrediction || null,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      });
      console.log(`📋 Transformed student user (ID: ${user.id}):`, {
        id: transformedUser.id,
        username: transformedUser.username,
        role: transformedUser.role,
        name: transformedUser.name,
        email: transformedUser.email,
        pin: transformedUser.pin ? '****' : null
      });
      return transformedUser;
    });
    
    // Seed coursestudents junction table
    const courseStudents = data.courses
      .filter(course => course.studentIds?.length > 0)
      .flatMap(course => 
        course.studentIds.map((studentid: string) => ({
          courseid: course.id,
          studentid
        }))
      );
    
    await insertData('course students', 'coursestudents', courseStudents, (cs) => ({
      courseid: cs.courseid || cs.courseId,
      studentid: cs.studentid || cs.studentId
    }));

    // Seed questions
    await insertData('questions', 'questions', data.exams.flatMap(exam => exam.questions || []), (question) => ({
      id: question.id || uuidv4(),
      type: question.type || 'multiple-choice',
      question: question.question || '',
      options: question.options || [],
      correctanswer: question.correctanswer || question.correctAnswer || null,
      points: question.points || 0,
      required: question.required || false,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed exams
    await insertData('exams', 'exams', data.exams, (exam) => ({
      id: exam.id,
      courseId: exam.courseId || exam.courseid,
      name: exam.name || 'Unnamed Exam',
      date: exam.date ? new Date(exam.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: exam.startTime || exam.starttime || '09:00:00',
      endTime: exam.endTime || exam.endtime || '12:00:00',
      location: exam.location || '',
      totalMarks: exam.totalMarks || exam.totalmarks || 100,
      duration: exam.duration || 180,
      totalPoints: exam.totalPoints || exam.totalpoints || 100,
      attempts: exam.attempts || 1,
      description: exam.description || '',
      instructions: exam.instructions || '',
      status: exam.status || 'draft',
      questions: exam.questions || [],
      showResults: exam.showResults !== undefined ? exam.showResults : true,
      randomizeQuestions: exam.randomizeQuestions || false,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed examquestions junction table
    const examQuestions = data.exams
      .filter(exam => exam.questions?.length > 0)
      .flatMap(exam => 
        exam.questions.map((question: any) => ({
          examid: exam.id,
          questionid: question.id
        }))
      );
    
    await insertData('exam questions', 'examquestions', examQuestions, (eq) => ({
      examid: eq.examid || eq.examId,
      questionid: eq.questionid || eq.questionId
    }));

    // Seed grades
    await insertData('grades', 'grades', data.grades, (grade) => ({
      id: grade.id,
      studentid: grade.studentid || grade.studentId,
      courseid: grade.courseid || grade.courseId,
      examid: grade.examid || grade.examId || null,
      name: grade.name || 'Unnamed Grade',
      score: grade.score || 0,
      maxscore: grade.maxscore || grade.maxScore || 100,
      weight: grade.weight || 100,
      date: grade.date ? new Date(grade.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      feedback: grade.feedback || null,
      islate: grade.islate || grade.late || false,
      isexcused: grade.isexcused || grade.excused || false,
      category: grade.category || 'exam',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed attendance
    await insertData('attendance', 'attendance', data.attendance, (att) => ({
      id: att.id,
      studentid: att.studentid || att.studentId,
      courseid: att.courseid || att.courseId,
      date: att.date ? new Date(att.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: att.status || 'present',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed resources
    await insertData('resources', 'resources', data.resources, (res) => ({
      id: res.id,
      courseid: res.courseid || res.courseId,
      title: res.title || 'Unnamed Resource',
      description: res.description || '',
      fileurl: res.fileurl || res.fileUrl || '',
      uploaddate: res.uploaddate || res.uploadDate ? new Date(res.uploaddate || res.uploadDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed schedules
    await insertData('schedules', 'schedules', data.schedules, (sched) => ({
      id: sched.id,
      courseid: sched.courseid || sched.courseId,
      dayofweek: sched.dayofweek || sched.dayOfWeek || 'Monday',
      starttime: sched.starttime || sched.startTime || '09:00:00',
      endtime: sched.endtime || sched.endTime || '10:00:00',
      location: sched.location || '',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed examSubmissions
    await insertData('exam submissions', 'examsubmissions', data.examsubmissions || [], (sub: any) => ({
      id: sub.id,
      examid: sub.examid || sub.examid,
      studentid: sub.studentid || sub.studentid,
      submissiondate: sub.submissiondate || sub.submissiondate ? new Date(sub.submissiondate || sub.submissiondate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      fileurl: sub.fileurl || sub.fileurl || '',
      marksawarded: sub.marksawarded || sub.marksAwarded || null,
      status: sub.status || 'in-progress',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed gradeCategories
    await insertData('grade categories', 'gradecategories', data.gradecategories || [], (cat: any) => ({
      id: cat.id,
      courseid: cat.courseid || cat.courseId,
      name: cat.name || 'Unnamed Category',
      weight: cat.weight || 0,
      color: cat.color || '#000000',
      description: cat.description || '',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed courseGrades
    await insertData('course grades', 'coursegrades', data.coursegrades || [], (grade: any) => ({
      id: grade.id,
      studentid: grade.studentid || grade.studentId,
      courseid: grade.courseid || grade.courseId,
      semester: grade.semester || 'Spring',
      year: grade.year || new Date().getFullYear(),
      credits: grade.credits || 3,
      percentage: grade.percentage || 0,
      lettergrade: grade.lettergrade || grade.letterGrade || 'F',
      gpa: grade.gpa || 0,
      finallettergrade: grade.finallettergrade || grade.finalLetterGrade || grade.lettergrade || grade.letterGrade || 'F',
      iscomplete: grade.iscomplete || grade.isComplete || false,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed gradeScales
    await insertData('grade scales', 'gradescales', data.gradescales || [], (scale: any) => ({
      id: scale.id,
      name: scale.name || 'Unnamed Scale',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed gradeScaleItems
    await insertData('grade scale items', 'gradescaleitems', (data.gradescales || []).flatMap((scale: any) => 
      scale.scale.map((item: any) => ({
        id: uuidv4(),
        gradescaleid: scale.id,
        letter: item.letter || 'F',
        minpercentage: item.minpercentage || item.minPercentage || 0,
        maxpercentage: item.maxpercentage || item.maxPercentage || 0,
        gpapoints: item.gpapoints || item.gpaPoints || 0,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      }))
    ));

    // Seed transcripts
    await insertData('transcripts', 'transcripts', data.transcripts, (transcript) => ({
      id: transcript.id,
      studentid: transcript.studentid || transcript.studentId,
      generateddate: transcript.generateddate || transcript.generatedDate ? new Date(transcript.generateddate || transcript.generatedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      generatedby: transcript.generatedby || transcript.generatedBy || adminAndInstructors[0]?.id || uuidv4(),
      cumulativegpa: transcript.cumulativegpa || transcript.cumulativeGPA || 0,
      totalcredits: transcript.totalcredits || transcript.totalCredits || 0,
      academicstanding: transcript.academicstanding || transcript.academicStanding || 'Good Standing',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));

    // Seed transcriptsemesters
    const transcriptSemesters = data.transcripts
      .filter(transcript => transcript.semesters?.length > 0)
      .flatMap(transcript => 
        transcript.semesters.map((semester: any) => ({
          id: uuidv4(),
          transcriptid: transcript.id,
          semester: semester.semester || 'Spring',
          year: semester.year || new Date().getFullYear(),
          semestergpa: semester.semestergpa || semester.semesterGPA || 0,
          semestercredits: semester.semestercredits || semester.semesterCredits || 0,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        }))
      );
    
    await insertData('transcript semesters', 'transcriptsemesters', transcriptSemesters);

    // Seed transcriptsemestercourses
    const transcriptSemesterCourses = (data.transcripts || [])
      .filter((transcript: any) => transcript?.semesters?.length > 0)
      .flatMap((transcript: any) => 
        transcript.semesters.flatMap((semester: any) => 
          (semester.courses || []).map((course: any) => ({
            transcriptsemesterid: semester.id || uuidv4(),
            coursegradeid: course.id,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          }))
        )
      );
    
    await insertData('transcript semester courses', 'transcriptsemestercourses', transcriptSemesterCourses);
    
    // Seed studentPerformances
    const studentPerformances = (data.studentperformances || []).map((perf: any) => ({
      id: perf.id || uuidv4(),
      studentid: perf.studentid || perf.studentId,
      courseid: perf.courseid || perf.courseId,
      overallperformance: perf.overallperformance || perf.overallPerformance || 0,
      predictionstatus: perf.predictionstatus || perf.predictionStatus || 'average',
      lastupdated: perf.lastupdated || perf.lastUpdated || new Date().toISOString().split('T')[0],
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }));
    
    await insertData('student performances', 'studentperformances', studentPerformances);
    
    // Seed weekly tests
    const weeklyTests = (data.studentperformances || [])
      .filter((perf: any) => perf?.weeklytests?.length > 0)
      .flatMap((perf: any) => 
        (perf.weeklyTests || []).map((test: any) => ({
          id: uuidv4(),
          studentperformanceid: perf.id,
          week: test.week || 1,
          score: test.score || 0,
          maxscore: test.maxscore || test.maxScore || 100,
          date: test.date ? new Date(test.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        }))
      );
    
    await insertData('weekly tests', 'weeklytests', weeklyTests);
    
    // Seed monthly tests
    const monthlyTests = (data.studentperformances || [])
      .filter((perf: any) => perf?.monthlytests?.length > 0)
      .flatMap((perf: any) => 
        (perf.monthlyTests || []).map((test: any) => ({
          id: uuidv4(),
          studentperformanceid: perf.id,
          month: test.month || 1,
          score: test.score || 0,
          maxscore: test.maxscore || test.maxScore || 100,
          date: test.date ? new Date(test.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        }))
      );
    
    await insertData('monthly tests', 'monthlytests', monthlyTests);

    // Seed moduleexams
    const moduleExams = (data.studentperformances || [])
      .filter((perf: any) => perf?.moduleexams?.length > 0)
      .flatMap((perf: any) => 
        (perf.moduleExams || []).map((exam: any) => ({
          id: uuidv4(),
          studentperformanceid: perf.id,
          moduleid: exam.moduleid || exam.moduleId || uuidv4(),
          score: exam.score || 0,
          maxscore: exam.maxscore || exam.maxScore || 100,
          date: exam.date ? new Date(exam.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          passed: exam.passed || false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        }))
      );
    
    await insertData('module exams', 'moduleexams', moduleExams);
    
    console.log('🌱 All data seeded successfully');
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});