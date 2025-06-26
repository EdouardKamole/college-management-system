-- Enable UUID extension
create or replace function create_uuid_extension()
returns void
language plpgsql
as $$
begin
  create extension if not exists "uuid-ossp";
end;
$$;

-- Users table
create or replace function create_users_table()
returns void
language plpgsql
as $$
begin
  create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    username text not null unique,
    password text not null,
    pin text not null,
    role text not null check (role in ('admin', 'instructor', 'student')),
    name text not null,
    email text not null unique,
    date_of_birth date,
    home_district text,
    student_tel_no text,
    father_name text,
    father_contact text,
    mother_name text,
    mother_contact text,
    next_of_kin_name text,
    next_of_kin_contact text,
    education_level text check (education_level in ('UACE', 'Diploma', 'Degree', 'Master')),
    subject_combination text[],
    total_points integer,
    course_id uuid,
    date_of_enrollment date,
    academic_status text check (academic_status in ('active', 'probation', 'suspended', 'graduated')),
    performance_prediction text check (performance_prediction in ('excellent', 'good', 'average', 'poor', 'at-risk')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
  
  -- Indexes
  create index if not exists idx_users_role on users(role);
  create index if not exists idx_users_email on users(email);
  create index if not exists idx_users_course on users(course_id);
end;
$$;

-- Courses table
create or replace function create_courses_table()
returns void
language plpgsql
as $$
begin
  create table if not exists courses (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    schedule text,
    instructor_id uuid references users(id),
    student_ids uuid[],
    required_education_level text[],
    required_subjects text[],
    minimum_points integer,
    pass_mark integer,
    duration text,
    category text check (category in ('technical', 'engineering', 'operations', 'safety')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
  
  -- Indexes
  create index if not exists idx_courses_instructor on courses(instructor_id);
end;
$$;

-- Exams table
create or replace function create_exams_table()
returns void
language plpgsql
as $$
begin
  create table if not exists exams (
    id uuid primary key default uuid_generate_v4(),
    course_id uuid references courses(id) on delete cascade,
    name text not null,
    date date not null,
    time time not null,
    location text,
    total_marks integer not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    duration integer not null,
    total_points integer not null,
    attempts integer not null default 1,
    description text,
    status text not null,
    questions jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
  
  -- Indexes
  create index if not exists idx_exams_course on exams(course_id);
  create index if not exists idx_exams_date on exams(date);
end;
$$;

-- Grades table
create or replace function create_grades_table()
returns void
language plpgsql
as $$
begin
  create table if not exists grades (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references users(id) on delete cascade,
    course_id uuid references courses(id) on delete cascade,
    exam_id uuid references exams(id) on delete set null,
    name text not null,
    score numeric not null,
    max_score numeric not null,
    weight numeric not null,
    date date not null,
    feedback text,
    late boolean not null default false,
    excused boolean not null default false,
    category text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
  
  -- Indexes
  create index if not exists idx_grades_student on grades(student_id);
  create index if not exists idx_grades_course on grades(course_id);
  create index if not exists idx_grades_exam on grades(exam_id);
end;
$$;

-- Create other tables (Attendance, Resources, etc.) in a similar way...

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create or replace function create_updated_at_triggers()
returns void
language plpgsql
as $$
begin
  -- Users trigger
  execute 'create trigger update_users_updated_at
  before update on users
  for each row execute procedure update_updated_at_column()';
  
  -- Courses trigger
  execute 'create trigger update_courses_updated_at
  before update on courses
  for each row execute procedure update_updated_at_column()';
  
  -- Add triggers for other tables...
  
  exception when others then
    -- Ignore errors if triggers already exist
    null;
end;
$$;

-- Create RLS policies
create or replace function enable_row_level_security()
returns void
language plpgsql
as $$
begin
  -- Enable RLS on all tables
  alter table users enable row level security;
  alter table courses enable row level security;
  alter table exams enable row level security;
  alter table grades enable row level security;
  -- Enable RLS on other tables...
  
  -- Example policy (customize based on your requirements)
  create policy "Users can view their own profile"
    on users for select
    using (auth.uid() = id);
    
  -- Add more policies as needed
end;
$$;

-- Create a function to set up the entire schema
create or replace function setup_database()
returns void
language plpgsql
as $$
begin
  perform create_uuid_extension();
  perform create_users_table();
  perform create_courses_table();
  perform create_exams_table();
  perform create_grades_table();
  -- Call other table creation functions...
  
  perform create_updated_at_triggers();
  perform enable_row_level_security();
  
  -- Create default admin user if not exists
  insert into users (
    id, username, password, pin, role, name, email
  ) values (
    '00000000-0000-0000-0000-000000000000',
    'admin',
    -- Default password: admin123 (hashed with bcrypt)
    '$2a$10$XFDq3wNxXRwlEuFLsL6YQeX0W3XzbfWY4vKvzQ5L5h5X5Q2X5X5X5a',
    '1234',
    'admin',
    'Admin User',
    'admin@example.com'
  ) on conflict (id) do nothing;
  
  raise notice 'Database setup completed successfully';
exception when others then
  raise exception 'Error setting up database: %', sqlerrm;
end;
$$;

-- Run the setup function
select setup_database();
