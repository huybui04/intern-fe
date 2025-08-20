export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  price: number;
  thumbnailUrl: string;
  introVideoUrl: string;
  tags: string[];
  maxStudents: number;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  instructorName: string;
  rating?: number;
  studentsCount?: number;
  enrolledStudents?: Array<{
    studentId: string;
    studentName: string;
    enrolledAt: string;
    progress: number;
    completedLessons: any[];
    _id: string;
  }>;
}
