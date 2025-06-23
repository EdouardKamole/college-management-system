import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password: string
          pin: string
          role: "admin" | "instructor" | "student"
          name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          pin: string
          role: "admin" | "instructor" | "student"
          name: string
          email: string
        }
        Update: {
          username?: string
          password?: string
          pin?: string
          role?: "admin" | "instructor" | "student"
          name?: string
          email?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          description: string
          schedule: string
          instructor_id: string
          student_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description: string
          schedule: string
          instructor_id: string
          student_ids?: string[]
        }
        Update: {
          name?: string
          description?: string
          schedule?: string
          instructor_id?: string
          student_ids?: string[]
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string
          content: string
          file_url: string | null
          file_type: string | null
          file_size: number | null
          course_id: string
          uploaded_by: string
          upload_date: string
          is_public: boolean
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description: string
          content?: string
          file_url?: string | null
          file_type?: string | null
          file_size?: number | null
          course_id: string
          uploaded_by: string
          is_public?: boolean
          tags?: string[]
        }
        Update: {
          title?: string
          description?: string
          content?: string
          file_url?: string | null
          file_type?: string | null
          file_size?: number | null
          course_id?: string
          is_public?: boolean
          tags?: string[]
        }
      }
    }
  }
}
