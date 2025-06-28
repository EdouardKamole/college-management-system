"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type {
  User,
  Course,
  Exam,
  Grade,
  Attendance,
  Resource,
  Schedule,
  ExamSubmission,
  GradeCategory,
  CourseGrade,
  GradeScale,
  // Transcript,
} from "@/lib/data";

interface AppData {
  users: User[];
  courses: Course[];
  exams: Exam[];
  grades: Grade[];
  attendance: Attendance[];
  resources: Resource[];
  schedules: Schedule[];
  examSubmissions: ExamSubmission[];
  gradeCategories: GradeCategory[];
  courseGrades: CourseGrade[];
  gradeScales: GradeScale[];
  transcripts: Transcript[];
}

import type { Transcript } from "@/lib/data";

export function useSupabaseData() {
  const [data, setData] = useState<AppData>({
    users: [],
    courses: [],
    exams: [],
    grades: [],
    attendance: [],
    resources: [],
    schedules: [],
    examSubmissions: [],
    gradeCategories: [],
    courseGrades: [],
    gradeScales: [],
    transcripts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);

      // Load users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("*");
      if (usersError) throw usersError;

      // Load courses
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("*");
      if (coursesError) throw coursesError;

      // Load resources
      const { data: resources, error: resourcesError } = await supabase
        .from("resources")
        .select("*");
      if (resourcesError) throw resourcesError;

      // Load exams
      const { data: exams, error: examsError } = await supabase
        .from("exams")
        .select("*");
      if (examsError) throw examsError;

      // Load grades
      const { data: grades, error: gradesError } = await supabase
        .from("grades")
        .select("*");
      if (gradesError) throw gradesError;

      // Load attendance
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("*");
      if (attendanceError) throw attendanceError;

      // Load schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from("schedules")
        .select("*");
      if (schedulesError) throw schedulesError;

      // Load examSubmissions
      const { data: examSubmissions, error: examSubmissionsError } = await supabase
        .from("examsubmissions")
        .select("*");
      if (examSubmissionsError) throw examSubmissionsError;

      // Load gradeCategories
      const { data: gradeCategories, error: gradeCategoriesError } = await supabase
        .from("gradecategories")
        .select("*");
      if (gradeCategoriesError) throw gradeCategoriesError;

      // Load courseGrades
      const { data: courseGrades, error: courseGradesError } = await supabase
        .from("coursegrades")
        .select("*");
      if (courseGradesError) throw courseGradesError;

      // Load gradeScales
      const { data: gradeScales, error: gradeScalesError } = await supabase
        .from("gradescales")
        .select("*");
      if (gradeScalesError) throw gradeScalesError;

      // Load transcripts
      const { data: transcripts, error: transcriptsError } = await supabase
        .from("transcripts")
        .select("*");
      if (transcriptsError) throw transcriptsError;

      setData({
        users: users || [],
        courses: courses || [],
        resources: resources || [],
        exams: exams || [],
        grades: grades || [],
        attendance: attendance || [],
        schedules: schedules || [],
        examSubmissions: examSubmissions || [],
        gradeCategories: gradeCategories || [],
        courseGrades: courseGrades || [],
        gradeScales: gradeScales || [],
        transcripts: transcripts || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Add user
  const addUser = async (userData: Omit<User, "id">) => {
    try {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      setData((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
      }));

      return newUser;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to add user"
      );
    }
  };

  // Update user
  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update(userData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setData((prev) => ({
        ...prev,
        users: prev.users.map((user) => (user.id === id ? updatedUser : user)),
      }));

      return updatedUser;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to update user"
      );
    }
  };

  // Delete user
  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) throw error;

      setData((prev) => ({
        ...prev,
        users: prev.users.filter((user) => user.id !== id),
      }));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete user"
      );
    }
  };

  // Add resource
  const addResource = async (resourceData: Omit<Resource, "id">) => {
    try {
      const { data: newResource, error } = await supabase
        .from("resources")
        .insert([resourceData])
        .select()
        .single();

      if (error) throw error;

      setData((prev) => ({
        ...prev,
        resources: [...prev.resources, newResource],
      }));

      return newResource;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to add resource"
      );
    }
  };

  // Update resource
  const updateResource = async (
    id: string,
    resourceData: Partial<Resource>
  ) => {
    try {
      const { data: updatedResource, error } = await supabase
        .from("resources")
        .update(resourceData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setData((prev) => ({
        ...prev,
        resources: prev.resources.map((resource) =>
          resource.id === id ? updatedResource : resource
        ),
      }));

      return updatedResource;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to update resource"
      );
    }
  };

  // Delete resource
  const deleteResource = async (id: string) => {
    try {
      const { error } = await supabase.from("resources").delete().eq("id", id);

      if (error) throw error;

      setData((prev) => ({
        ...prev,
        resources: prev.resources.filter((resource) => resource.id !== id),
      }));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete resource"
      );
    }
  };

  // Add course
  const addCourse = async (courseData: Omit<Course, "id">) => {
    try {
      const { data: newCourse, error } = await supabase
        .from("courses")
        .insert([courseData])
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        courses: [...prev.courses, newCourse],
      }));
      return newCourse;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to add course");
    }
  };

  // Update course
  const updateCourse = async (id: string, courseData: Partial<Course>) => {
    try {
      const { data: updatedCourse, error } = await supabase
        .from("courses")
        .update(courseData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => (c.id === id ? updatedCourse : c)),
      }));
      return updatedCourse;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to update course");
    }
  };

  // Delete course
  const deleteCourse = async (id: string) => {
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        courses: prev.courses.filter((c) => c.id !== id),
      }));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  // Add exam
  const addExam = async (examData: Omit<Exam, "id">) => {
    try {
      const { data: newExam, error } = await supabase
        .from("exams")
        .insert([examData])
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        exams: [...prev.exams, newExam],
      }));
      return newExam;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to add exam");
    }
  };

  // Update exam
  const updateExam = async (id: string, examData: Partial<Exam>) => {
    try {
      const { data: updatedExam, error } = await supabase
        .from("exams")
        .update(examData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        exams: prev.exams.map((e) => (e.id === id ? updatedExam : e)),
      }));
      return updatedExam;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to update exam");
    }
  };

  // Delete exam
  const deleteExam = async (id: string) => {
    try {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        exams: prev.exams.filter((e) => e.id !== id),
        examSubmissions: prev.examSubmissions.filter((s) => s.examid !== id),
      }));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to delete exam");
    }
  };

  // Add exam submission
  const addExamSubmission = async (submissionData: Omit<ExamSubmission, "id">) => {
    try {
      const { data: newSubmission, error } = await supabase
        .from("examsubmissions")
        .insert([submissionData])
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        examSubmissions: [...prev.examSubmissions, newSubmission],
      }));
      return newSubmission;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to add exam submission");
    }
  };

  // Update exam submission
  const updateExamSubmission = async (id: string, submissionData: Partial<ExamSubmission>) => {
    try {
      const { data: updatedSubmission, error } = await supabase
        .from("examsubmissions")
        .update(submissionData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        examSubmissions: prev.examSubmissions.map((s) => (s.id === id ? updatedSubmission : s)),
      }));
      return updatedSubmission;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to update exam submission");
    }
  };

  // Add grade
  const addGrade = async (gradeData: Omit<Grade, "id">) => {
    try {
      const { data: newGrade, error } = await supabase
        .from("grades")
        .insert([gradeData])
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        grades: [...prev.grades, newGrade],
      }));
      return newGrade;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to add grade");
    }
  };

  // Update grade
  const updateGrade = async (id: string, gradeData: Partial<Grade>) => {
    try {
      const { data: updatedGrade, error } = await supabase
        .from("grades")
        .update(gradeData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        grades: prev.grades.map((g) => (g.id === id ? updatedGrade : g)),
      }));
      return updatedGrade;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to update grade");
    }
  };

  // Delete grade
  const deleteGrade = async (id: string) => {
    try {
      const { error } = await supabase.from("grades").delete().eq("id", id);
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        grades: prev.grades.filter((g) => g.id !== id),
      }));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to delete grade");
    }
  };

  // Delete exam submission
  const deleteExamSubmission = async (id: string) => {
    try {
      const { error } = await supabase.from("examSubmissions").delete().eq("id", id);
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        examSubmissions: prev.examSubmissions.filter((s) => s.id !== id),
      }));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to delete exam submission");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add transcript
  const addTranscript = async (transcript: Omit<Transcript, "id">) => {
    try {
      const { data: newTranscript, error } = await supabase
        .from("transcripts")
        .insert([transcript])
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        transcripts: [...prev.transcripts, newTranscript],
      }));
      return newTranscript;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to add transcript");
    }
  };

  // Add attendance
  const addAttendance = async (attendanceData: Omit<Attendance, "id">) => {
    try {
      const { data: newAttendance, error } = await supabase
        .from("attendance")
        .insert([attendanceData])
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        attendance: [...prev.attendance, newAttendance],
      }));
      return newAttendance;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to add attendance");
    }
  };

  // Update attendance
  const updateAttendance = async (id: string, attendanceData: Partial<Attendance>) => {
    try {
      const { data: updatedAttendance, error } = await supabase
        .from("attendance")
        .update(attendanceData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        attendance: prev.attendance.map((a) => (a.id === id ? updatedAttendance : a)),
      }));
      return updatedAttendance;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to update attendance");
    }
  };

  return {
    data,
    loading,
    error,
    refetch: loadData,
    // User operations
    addUser,
    updateUser,
    deleteUser,
    // Resource operations
    addResource,
    updateResource,
    deleteResource,
    addCourse,
    updateCourse,
    deleteCourse,
    addExam,
    updateExam,
    deleteExam,
    addExamSubmission,
    updateExamSubmission,
    deleteExamSubmission,
    addGrade,
    updateGrade,
    deleteGrade,
    addTranscript,
    addAttendance,
    updateAttendance,
  };
}
