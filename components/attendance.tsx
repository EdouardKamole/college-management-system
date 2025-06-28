"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSupabaseData } from "@/hooks/use-supabase-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { RotateCcw } from "lucide-react";

// Attendance status options
const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

export function Attendance() {
  const { user } = useAuth();
  const { data, loading, error, addAttendance, updateAttendance, refetch } = useSupabaseData();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  type AttendanceRecord = {
    studentid: string;
    status: string;
    notes: any;
  };
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]); // [{studentId, status, notes}]
  const [saving, setSaving] = useState(false);


  // Get courses for instructor or student
  const userCourses = React.useMemo(() => {
    if (!data?.courses) return [];
    if (user?.role === "instructor") {
      return data.courses.filter((c) => c.instructorid === user.id);
    } else if (user?.role === "student") {
      return data.courses.filter((c) => c.studentids?.includes?.(user.id) ?? false);
    } else if (user?.role === "admin") {
      return data.courses;
    }
    return [];
  }, [data?.courses, user]);

  // Get students for selected course
  const enrolledStudents = React.useMemo(() => {
    if (!selectedCourse || !data?.users) return [];
    const course = data.courses.find((c) => c.id === selectedCourse);
    return data.users.filter((u) => course?.studentids?.includes?.(u.id));
  }, [selectedCourse, data?.users, data?.courses]);

  // Fetch attendance for selected course & date
  useEffect(() => {
    if (!selectedCourse || !selectedDate || !data?.attendance) {
      setAttendance([]);
      return;
    }
    const filtered = data.attendance.filter(
      (a) => a.courseid === selectedCourse && a.date === selectedDate
    );
    // Initialize attendance list for all enrolled students
    setAttendance(
      enrolledStudents.map((student) => {
        const existing = filtered.find((a) => a.studentid === student.id);
        return {
          studentid: student.id,
          status: existing?.status || "present",
          notes: existing?.notes || "",
        };
      })
    );
  }, [selectedCourse, selectedDate, data?.attendance, enrolledStudents]);

  // Save attendance
  const handleSave = async () => {
    setSaving(true);
    try {
      for (const record of attendance) {
        const existing = data.attendance.find(
          (a) =>
            a.courseid === selectedCourse &&
            a.date === selectedDate &&
            a.studentid === record.studentid
        );
        if (existing) {
          await updateAttendance(existing.id, {
            ...existing,
            status: record.status,
            notes: record.notes,
          });
        } else {
          await addAttendance({
            courseid: selectedCourse,
            date: selectedDate,
            studentid: record.studentid,
            status: record.status,
            notes: record.notes,
            markedBy: user?.id,
          });
        }
      }
      await refetch();
    } catch (err) {
      // Optionally show toast
      console.error("Error saving attendance:", err);
    } finally {
      setSaving(false);
    }
  };

  // Filter for student view
  const myAttendance = React.useMemo(() => {
    if (user?.role !== "student" || !data?.attendance) return [];
    return data.attendance.filter((a) => a.studentid === user.id);
  }, [user, data?.attendance]);

  // --- Loading/Error overlays ---
  if (loading || saving) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-60 z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4" />
          <span className="text-lg text-blue-700">{saving ? "Saving attendance..." : "Loading attendance..."}</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-60 z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mb-4" />
          <span className="text-lg text-red-700">Error loading attendance: {error}</span>
        </div>
      </div>
    );
  }

  // --- Student view ---
  if (user?.role === "student") {
    const attendanceRate = myAttendance.length
      ? Math.round(
          (myAttendance.filter((a) => a.status === "present").length / myAttendance.length) * 100
        )
      : 0;

    // Find today's courses for the student
    const today = new Date().toISOString().slice(0, 10);
    const todaysCourses = data.courses?.filter((c) => c.studentids?.includes(user.id)) || [];
    // Check if already marked for today
    const myTodayAttendance = myAttendance.filter((a) => a.date === today);

    // Helper to check if marked
    const isMarkedPresent = (courseId: string) =>
      myTodayAttendance.some((a) => a.courseid === courseId && a.status === "present");

    // Function to mark present
    const handleMarkPresent = async (courseId: string) => {
      try {
        await addAttendance({
          courseid: courseId,
          date: today,
          studentid: user.id,
          status: "present",
          notes: "",
          markedBy: user.id,
        });
        await refetch();
      } catch (err) {
        alert("Error marking attendance: " + (err instanceof Error ? err.message : err));
      }
    };

    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Attendance</CardTitle>
              <CardDescription>Overview of your attendance records</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={refetch}
              disabled={loading || saving}
              aria-label="Reload attendance"
            >
              <RotateCcw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <Badge variant="secondary">Attendance Rate: {attendanceRate}%</Badge>
              <span className="text-muted-foreground text-sm">
                Total Sessions: {myAttendance.length}
              </span>
            </div>
            {/* Student self-mark for today's courses */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Mark Yourself Present for Today</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>
                        {isMarkedPresent(course.id) ? (
                          <Badge variant="success">Present</Badge>
                        ) : (
                          <Badge variant="secondary">Not Marked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          disabled={isMarkedPresent(course.id)}
                          onClick={() => handleMarkPresent(course.id)}
                        >
                          {isMarkedPresent(course.id) ? "Marked" : "Mark Present"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Attendance history table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAttendance.map((a) => {
                  const course = data.courses.find((c) => c.id === a.courseid);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{a.date}</TableCell>
                      <TableCell>{course?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "present" ? "success" : a.status === "absent" ? "destructive" : "default"}>{a.status}</Badge>
                      </TableCell>
                      <TableCell>{a.notes}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Admin/Instructor view ---
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Attendance Management</CardTitle>
            <CardDescription>
              {user?.role === "admin"
                ? "View and manage attendance for all courses."
                : "Take attendance for your courses."}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="ml-2"
            onClick={refetch}
            disabled={loading || saving}
            aria-label="Reload attendance"
          >
            <RotateCcw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {userCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {selectedCourse && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record, i) => {
                      const student = enrolledStudents.find((s) => s.id === record.studentid);
                      return (
                        <TableRow key={record.studentid}>
                          <TableCell>{student?.name || record.studentid}</TableCell>
                          <TableCell>
                            <Select
                              value={record.status}
                              onValueChange={(val) => {
                                setAttendance((prev) =>
                                  prev.map((r, idx) =>
                                    idx === i ? { ...r, status: val } : r
                                  )
                                );
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={record.notes}
                              onChange={(e) => {
                                setAttendance((prev) =>
                                  prev.map((r, idx) =>
                                    idx === i ? { ...r, notes: e.target.value } : r
                                  )
                                );
                              }}
                              placeholder="Notes (optional)"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
