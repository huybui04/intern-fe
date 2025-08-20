export interface Assignment {
  _id?: string;
  id?: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description: string;
  instructions?: string;
  questions?: Question[];
  totalPoints: number;
  timeLimit?: number;
  dueDate?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id?: string;
  question: string;
  type: "multiple_choice" | "essay" | "true_false";
  options?: string[];
  correctAnswer?: string | string[] | boolean | number;
  points: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: Answer[];
  submittedAt: string;
  score?: number;
  feedback?: string;
  status: "submitted" | "graded" | "late";
  gradedAt?: string;
  gradedBy?: string;
}

export interface Answer {
  questionId: string;
  answer: string | string[] | boolean | number;
}
