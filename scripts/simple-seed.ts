import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import data from '../lib/data';
const { initialData } = data;

dotenv.config({ path: '.env.local' });

// Type definitions
interface User {
  id?: string;
  username: string;
  role: string;
  [key: string]: any;
}

interface Course {
  name: string;
  instructor_id?: string | null;
  [key: string]: any;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function prepareCourseData(courses: any[], users: UserSeedData[]): CourseSeedData[] {
  const now = new Date().toISOString();
  return courses.map(course => ({
    id: uuidv4(),
    name: course.name,
    description: course.description || '',
    schedule: course.schedule || '',
    instructor_id: users.find(u => u.role === 'instructor')?.id || null,
    student_ids: [],
    required_education_level: [],
    required_subjects: [],
    minimum_points: course.minimumPoints || 0,
    pass_mark: course.passMark || 0,
    duration: course.duration || '',
    category: course.category || 'technical',
    created_at: now,
    updated_at: now
  }));
}

async function seedData() {
  console.log('🚀 Starting data seeding...');
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await clearTable('courses');
    await clearTable('users');
    
    // Prepare and seed users
    console.log('👥 Seeding users...');
    const preparedUsers = prepareUserData(initialData.users);
    const users = await seedTable<UserSeedData>('users', preparedUsers);
    
    // Prepare and seed courses
    console.log('📚 Seeding courses...');
    const preparedCourses = prepareCourseData(initialData.courses, users);
    await seedTable<CourseSeedData>('courses', preparedCourses);
    
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:');
    console.error(error);
    process.exit(1);
  }
}

async function clearTable(tableName: string): Promise<void> {
  console.log(`  Clearing ${tableName}...`);
  // First, check if the table exists and has data
  const { data, error: checkError } = await supabase
    .from(tableName)
    .select('id')
    .limit(1);
    
  if (checkError) {
    // If table doesn't exist, that's fine - we'll create it
    if (checkError.code === '42P01') return;
    throw checkError;
  }
  
  // If we got here and there's data, delete it using a raw SQL query
  if (data && data.length > 0) {
    const { error: deleteError } = await supabase.rpc('execute_sql', {
      query: `DELETE FROM ${tableName};`
    });
    
    if (deleteError) throw deleteError;
  }
}

// Convert camelCase to snake_case for database fields
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Define the exact shape of user data we expect
interface UserSeedData {
  id: string;
  username: string;
  password: string;
  pin: string;
  role: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface CourseSeedData {
  id: string;
  name: string;
  description: string;
  schedule: string;
  instructor_id: string | null;
  student_ids: string[];
  required_education_level: string[];
  required_subjects: string[];
  minimum_points: number;
  pass_mark: number;
  duration: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// Map the input data to match the database schema exactly
function prepareUserData(data: any[]): UserSeedData[] {
  return data.map(user => ({
    id: uuidv4(), // Generate UUID for each user
    username: user.username,
    password: user.password,
    pin: user.pin,
    role: user.role,
    name: user.name,
    email: user.email,
    // Add timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

async function getTableSchema(tableName: string) {
  const { data, error } = await supabase
    .rpc('get_table_schema', { table_name: tableName });
  
  if (error) {
    console.warn(`Could not get schema for ${tableName}:`, error.message);
    return null;
  }
  return data;
}

async function seedTable<T>(tableName: string, data: T[]): Promise<T[]> {
  if (!data.length) return [];
  
  console.log(`  Seeding ${data.length} ${tableName}...`);
  
  try {
    // First, try to refresh the schema cache
    try {
      await supabase.rpc('reload_schema');
      console.log('  Refreshed database schema cache');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('  Could not refresh schema cache, continuing anyway:', errorMessage);
    }
    
    // Log first item being inserted
    console.log('  Sample data being inserted:', JSON.stringify(data[0], null, 2));
    
    // Try with explicit column mapping to avoid any case sensitivity issues
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data.map(item => ({
        id: (item as any).id,
        username: (item as any).username,
        password: (item as any).password,
        pin: (item as any).pin,
        role: (item as any).role,
        name: (item as any).name,
        email: (item as any).email,
        created_at: (item as any).created_at,
        updated_at: (item as any).updated_at
      })))
      .select();
      
    if (error) throw error;
    return result || [];
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    
    // Get detailed table information
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', tableName);
        
      if (!tableError && tableInfo) {
        console.log(`  Table ${tableName} columns:`, tableInfo);
      } else {
        console.error('  Could not fetch table columns:', tableError);
      }
    } catch (schemaError) {
      console.error('  Error fetching table schema:', schemaError);
    }
    
    throw error;
  }
}

// Run the seed function
seedData().catch(error => {
  console.error('Unhandled error in seed process:', error);
  process.exit(1);
});
