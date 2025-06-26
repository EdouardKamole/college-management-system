"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";

type Grade = Database["public"]["Tables"]["grades"]["Row"];
type InsertGrade = Database["public"]["Tables"]["grades"]["Insert"];
type UpdateGrade = Database["public"]["Tables"]["grades"]["Update"];

export function useGrades(courseId?: string, studentId?: string) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGrades = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase.from("grades").select("*");
      
      if (courseId) {
        query = query.eq("course_id", courseId);
      }
      
      if (studentId) {
        query = query.eq("student_id", studentId);
      }

      const { data, error: fetchError } = await query.order("date", { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      setGrades(data || []);
    } catch (err) {
      console.error("Error fetching grades:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch grades"));
    } finally {
      setIsLoading(false);
    }
  }, [courseId, studentId]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const addGrade = useCallback(async (grade: InsertGrade) => {
    try {
      const { data, error: insertError } = await supabase
        .from("grades")
        .insert(grade)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      
      // Update local state
      if (data) {
        setGrades(prev => [data, ...prev]);
      }
      
      return data;
    } catch (err) {
      console.error("Error adding grade:", err);
      throw err;
    }
  }, []);

  const updateGrade = useCallback(async ({ id, updates }: { id: string; updates: UpdateGrade }) => {
    try {
      const { data, error: updateError } = await supabase
        .from("grades")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      if (data) {
        setGrades(prev => prev.map(grade => 
          grade.id === id ? { ...grade, ...data } : grade
        ));
      }
      
      return data;
    } catch (err) {
      console.error("Error updating grade:", err);
      throw err;
    }
  }, []);

  const deleteGrade = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("grades")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }
      
      // Update local state
      setGrades(prev => prev.filter(grade => grade.id !== id));
    } catch (err) {
      console.error("Error deleting grade:", err);
      throw err;
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('grades_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'grades' 
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGrades(prev => [payload.new as Grade, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setGrades(prev => 
              prev.map(grade => 
                grade.id === payload.new.id ? (payload.new as Grade) : grade
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setGrades(prev => prev.filter(grade => grade.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    grades,
    isLoading,
    error,
    addGrade: {
      mutateAsync: addGrade,
      isLoading: false,
      error: null
    },
    updateGrade: {
      mutateAsync: updateGrade,
      isLoading: false,
      error: null
    },
    deleteGrade: {
      mutateAsync: deleteGrade,
      isLoading: false,
      error: null
    },
    refetch: fetchGrades
  };
}
