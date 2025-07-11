"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
} from "lucide-react";
import { calculateLetterGrade } from "@/lib/grade-utils";
import type { Course, Grade, User, GradeScale } from "@/lib/data";

interface GradeAnalyticsProps {
  courses: Course[];
  grades: Grade[];
  students: User[];
  gradeScale: GradeScale;
}

export function GradeAnalytics({
  courses,
  grades,
  students,
  gradeScale,
}: GradeAnalyticsProps) {
  const analytics = useMemo(() => {
    const courseAnalytics = courses.map((course) => {
      const courseGrades = grades.filter((g) => g.courseid === course.id);
      const enrolledStudents = students.filter((s) =>
        course.studentids.includes(s.id)
      );

      // Calculate student performance
      const studentPerformance = enrolledStudents.map((student) => {
        const studentGrades = courseGrades.filter(
          (g) => g.studentid === student.id
        );
        const totalScore = studentGrades.reduce(
          (sum, g) => sum + Number(g.score || 0),
          0
        );
        const totalMaxScore = studentGrades.reduce(
          (sum, g) => sum + Number(g.maxscore || 0),
          0
        );
        const percentage =
          totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
        const { letter } = calculateLetterGrade(percentage, gradeScale);

        return {
          student,
          percentage: isNaN(percentage) ? 0 : percentage,
          letterGrade: letter,
          totalGrades: studentGrades.length,
        };
      });

      // Grade distribution
      const gradeDistribution = gradeScale.scale.reduce((acc, grade) => {
        acc[grade.letter] = studentPerformance.filter(
          (sp) => sp.letterGrade === grade.letter
        ).length;
        return acc;
      }, {} as Record<string, number>);

      // Assignment analytics
      const assignmentTypes = [...new Set(courseGrades.map((g) => g.category))];
      const assignmentAnalytics = assignmentTypes.map((type) => {
        const typeGrades = courseGrades.filter((g) => g.category === type);
        const avgScore =
          typeGrades.length > 0
            ? typeGrades.reduce(
                (sum, g) =>
                  sum + (g.maxscore > 0 ? (g.score / g.maxscore) * 100 : 0),
                0
              ) / typeGrades.length
            : 0;

        return {
          type,
          count: typeGrades.length,
          averageScore: avgScore,
          highestScore:
            typeGrades.length > 0
              ? Math.max(...typeGrades.map((g) => (g.score / g.maxscore) * 100))
              : 0,
          lowestScore:
            typeGrades.length > 0
              ? Math.min(...typeGrades.map((g) => (g.score / g.maxscore) * 100))
              : 0,
        };
      });

      const classAverage =
        studentPerformance.length > 0
          ? studentPerformance.reduce((sum, sp) => sum + sp.percentage, 0) /
            studentPerformance.length
          : 0;

      return {
        course,
        studentPerformance,
        gradeDistribution,
        assignmentAnalytics,
        classAverage,
        totalStudents: enrolledStudents.length,
        totalGrades: courseGrades.length,
        passingRate:
          (studentPerformance.filter((sp) => sp.percentage >= 60).length /
            Math.max(studentPerformance.length, 1)) *
          100,
      };
    });

    return courseAnalytics;
  }, [courses, grades, students, gradeScale]);

  const overallStats = useMemo(() => {
    const allStudentPerformances = analytics.flatMap(
      (a) => a.studentPerformance
    );
    const totalStudents = new Set(
      allStudentPerformances.map((sp) => sp.student.id)
    ).size;
    const overallAverage =
      allStudentPerformances.length > 0
        ? allStudentPerformances.reduce((sum, sp) => sum + sp.percentage, 0) /
          allStudentPerformances.length
        : 0;

    const gradeDistribution = gradeScale.scale.reduce((acc, grade) => {
      acc[grade.letter] = allStudentPerformances.filter(
        (sp) => sp.letterGrade === grade.letter
      ).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStudents,
      overallAverage,
      gradeDistribution,
      totalCourses: courses.length,
      totalGrades: grades.length,
    };
  }, [analytics, gradeScale, courses.length, grades.length]);

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Average
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.overallAverage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              All courses combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.totalCourses}
            </div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalGrades}</div>
            <p className="text-xs text-muted-foreground">Recorded grades</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Grade Distribution</CardTitle>
          <CardDescription>
            Distribution of letter grades across all courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(overallStats.gradeDistribution).map(
              ([letter, count]) => {
                const percentage =
                  overallStats.totalStudents > 0
                    ? (count / overallStats.totalStudents) * 100
                    : 0;
                return (
                  <div
                    key={letter}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          letter.startsWith("A")
                            ? "default"
                            : letter.startsWith("B")
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {letter}
                      </Badge>
                      <span className="text-sm">{count} students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {percentage.toFixed(1)}%
                      </span>
                      <div className="w-20">
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course Analytics */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Course Performance Analysis</h3>
        {analytics.map((courseAnalytic) => (
          <Card key={courseAnalytic.course.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{courseAnalytic.course.name}</CardTitle>
                  <CardDescription>
                    {courseAnalytic.course.description}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {courseAnalytic.classAverage.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Class Average</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {courseAnalytic.totalStudents}
                  </div>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {courseAnalytic.totalGrades}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Grades</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {courseAnalytic.passingRate.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Passing Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {courseAnalytic.assignmentAnalytics.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assignment Types
                  </p>
                </div>
              </div>

              {/* Grade Distribution for Course */}
              <div>
                <h4 className="font-medium mb-3">Grade Distribution</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(courseAnalytic.gradeDistribution).map(
                    ([letter, count]) => {
                      const percentage =
                        courseAnalytic.totalStudents > 0
                          ? (count / courseAnalytic.totalStudents) * 100
                          : 0;
                      return (
                        <div
                          key={letter}
                          className="text-center p-3 border rounded"
                        >
                          <Badge
                            variant={
                              letter.startsWith("A")
                                ? "default"
                                : letter.startsWith("B")
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {letter}
                          </Badge>
                          <div className="mt-2">
                            <div className="text-lg font-bold">{count}</div>
                            <div className="text-sm text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Assignment Type Performance */}
              <div>
                <h4 className="font-medium mb-3">
                  Assignment Type Performance
                </h4>
                <div className="space-y-3">
                  {courseAnalytic.assignmentAnalytics.map((assignment) => (
                    <div
                      key={assignment.type}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {assignment.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({assignment.count} assignments)
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Range: {assignment.lowestScore.toFixed(1)}% -{" "}
                          {assignment.highestScore.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {assignment.averageScore.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Average
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top and Bottom Performers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Top Performers
                  </h4>
                  <div className="space-y-2">
                    {courseAnalytic.studentPerformance
                      .sort((a, b) => b.percentage - a.percentage)
                      .slice(0, 3)
                      .map((performance, index) => (
                        <div
                          key={performance.student.id}
                          className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              #{index + 1}
                            </span>
                            <span className="text-sm">
                              {performance.student.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="default">
                              {performance.letterGrade}
                            </Badge>
                            <span className="text-sm font-medium">
                              {performance.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                    Needs Attention
                  </h4>
                  <div className="space-y-2">
                    {courseAnalytic.studentPerformance
                      .filter((p) => p.percentage < 70)
                      .sort((a, b) => a.percentage - b.percentage)
                      .slice(0, 3)
                      .map((performance) => (
                        <div
                          key={performance.student.id}
                          className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">
                              {performance.student.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="destructive">
                              {performance.letterGrade}
                            </Badge>
                            <span className="text-sm font-medium">
                              {performance.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
