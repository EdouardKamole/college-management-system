"use client";

import { useState, useEffect } from "react";
import {
  type User,
  type Course,
  type Exam,
  type Grade,
  type Attendance,
  type Resource,
  type Schedule,
  type ExamSubmission,
  type GradeCategory,
  type CourseGrade,
  type GradeScale,
  type Transcript,
} from "@/lib/data";

export interface AppData {
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

export function useData() {
  const [data, setData] = useState<AppData>(initialData);

  useEffect(() => {
    const savedData = localStorage.getItem("uafc-data");
    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      localStorage.setItem("uafc-data", JSON.stringify(initialData));
    }
  }, []);

  const updateData = (newData: Partial<AppData>) => {
    const updatedData = { ...data, ...newData };
    setData(updatedData);
    localStorage.setItem("uafc-data", JSON.stringify(updatedData));
  };

  return { data, updateData };
}
