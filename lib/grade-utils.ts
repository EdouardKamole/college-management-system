import type { CourseGrade, GradeCategory, GradeScale, Grade } from "@/lib/data"

export function calculateCourseGrade(
  grades: Grade[],
  categories: GradeCategory[],
  courseId: string,
): { percentage: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {}
  let totalWeightedScore = 0
  let totalWeight = 0

  // Group grades by category
  const gradesByCategory = grades.reduce(
    (acc, grade) => {
      if (!acc[grade.category]) {
        acc[grade.category] = []
      }
      acc[grade.category].push(grade)
      return acc
    },
    {} as Record<string, Grade[]>,
  )

  // Calculate weighted average for each category
  categories.forEach((category) => {
    const categoryGrades = gradesByCategory[category.name.toLowerCase()] || []

    if (categoryGrades.length > 0) {
      const categoryAverage =
        categoryGrades.reduce((sum, grade) => {
          return sum + (grade.score / grade.maxScore) * 100
        }, 0) / categoryGrades.length

      breakdown[category.id] = categoryAverage
      totalWeightedScore += categoryAverage * (category.weight / 100)
      totalWeight += category.weight / 100
    }
  })

  const percentage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0

  return { percentage, breakdown }
}

export function calculateLetterGrade(percentage: number, gradeScale: GradeScale): { letter: string; gpa: number } {
  for (const grade of gradeScale.scale) {
    if (percentage >= grade.minPercentage) {
      return { letter: grade.letter, gpa: grade.gpaPoints }
    }
  }

  // Default to lowest grade
  const lowestGrade = gradeScale.scale[gradeScale.scale.length - 1]
  return { letter: lowestGrade.letter, gpa: lowestGrade.gpaPoints }
}

export function calculateGPA(courseGrades: CourseGrade[]): number {
  if (courseGrades.length === 0) return 0

  const totalGradePoints = courseGrades.reduce((sum, cg) => sum + cg.gpa * cg.credits, 0)
  const totalCredits = courseGrades.reduce((sum, cg) => sum + cg.credits, 0)

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0
}

export function calculateSemesterGPA(courseGrades: CourseGrade[], semester: string, year: number): number {
  const semesterGrades = courseGrades.filter((cg) => cg.semester === semester && cg.year === year)
  return calculateGPA(semesterGrades)
}

export function getAcademicStanding(gpa: number): string {
  if (gpa >= 3.75) return "Dean's List"
  if (gpa >= 3.5) return "High Honors"
  if (gpa >= 3.0) return "Honors"
  if (gpa >= 2.5) return "Good Standing"
  if (gpa >= 2.0) return "Satisfactory"
  return "Academic Probation"
}
