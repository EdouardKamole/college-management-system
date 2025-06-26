require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import data from '../lib/data';
const { initialData } = data;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function resetDatabase() {
  console.log('🚀 Starting database reset...');
  
  try {
    // Disable triggers temporarily to avoid foreign key constraint issues
    await supabase.rpc('drop_all_tables_in_schema', { schema_name: 'public' });
    
    // Recreate the schema
    console.log('🔨 Recreating database schema...');
    const { error: schemaError } = await supabase.rpc('create_schema');
    if (schemaError) throw schemaError;
    
    console.log('✅ Database reset complete');
    return true;
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    return false;
  }
}

async function seedData() {
  console.log('🌱 Seeding data...');
  
  try {
    // Seed users
    if (initialData.users.length > 0) {
      console.log(`👥 Seeding ${initialData.users.length} users...`);
      const { data: users, error } = await supabase
        .from('users')
        .insert(initialData.users.map(user => ({
          id: user.id,
          username: user.username,
          password: user.password,
          pin: user.pin,
          role: user.role,
          name: user.name,
          email: user.email,
          date_of_birth: user.dateOfBirth,
          home_district: user.homeDistrict,
          student_tel_no: user.studentTelNo,
          father_name: user.fatherName,
          father_contact: user.fatherContact,
          mother_name: user.motherName,
          mother_contact: user.motherContact,
          next_of_kin_name: user.nextOfKinName,
          next_of_kin_contact: user.nextOfKinContact,
          education_level: user.educationLevel,
          subject_combination: user.subjectCombination,
          total_points: user.totalPoints,
          course_id: user.courseId,
          date_of_enrollment: user.dateOfEnrollment,
          academic_status: user.academicStatus,
          performance_prediction: user.performancePrediction
        })))
        .select();
        
      if (error) throw error;
      console.log(`✅ Seeded ${users?.length || 0} users`);
    }
    
    // Add other seed operations here
    
    console.log('🌱 All data seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');
  
  if (shouldReset) {
    const resetSuccess = await resetDatabase();
    if (!resetSuccess) process.exit(1);
  }
  
  const seedSuccess = await seedData();
  process.exit(seedSuccess ? 0 : 1);
}

main();
