-- Function to drop all tables in a schema
CREATE OR REPLACE FUNCTION drop_all_tables_in_schema(schema_name TEXT) 
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers to avoid foreign key constraint issues
    SET session_replication_role = 'replica';
    
    -- Drop all tables in the specified schema
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = schema_name
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(schema_name) || '.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
END;
$$ LANGUAGE plpgsql;

-- Function to create the schema
CREATE OR REPLACE FUNCTION create_schema() 
RETURNS void AS $$
BEGIN
    -- Enable UUID extension if not exists
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
        course_id UUID,
        date_of_enrollment DATE,
        academic_status VARCHAR(20) CHECK (academic_status IN ('active', 'probation', 'suspended', 'graduated')),
        performance_prediction VARCHAR(20) CHECK (performance_prediction IN ('excellent', 'good', 'average', 'poor', 'at-risk')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
    );

    -- Create courses table
    CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        schedule VARCHAR(255),
        instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        student_ids UUID[] DEFAULT '{}',
        required_education_level VARCHAR(20)[],
        required_subjects TEXT[],
        minimum_points INTEGER,
        pass_mark INTEGER,
        duration VARCHAR(50),
        category VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add foreign key to users table after courses is created
    ALTER TABLE users 
    ADD CONSTRAINT fk_course FOREIGN KEY (course_id) 
    REFERENCES courses(id) ON DELETE SET NULL;

    -- Create other tables as needed...
    
    -- Create trigger function for updated_at
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create triggers for updated_at
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

    CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    
    -- Add more triggers as needed...
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
    
    -- Add more indexes as needed...
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
