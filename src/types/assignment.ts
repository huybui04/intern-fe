export interface Assignment {
  _id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description: string;
  questions?: Question[];
  dueDate: string;
  maxScore?: number;
  timeLimit?: number;
  instructions?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id?: string;
  question: string;
  type: "multiple_choice" | "essay" | "true_false";
  options?: string[];
  correctAnswer: any;
  points: number;
}

export interface Submission {
  _id: string;
  assignmentId: string;
  studentId: string;
  answers: Answer[];
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: "submitted" | "graded" | "late";
}

export interface Answer {
  questionId: string;
  answer: string | string[] | boolean;
}
