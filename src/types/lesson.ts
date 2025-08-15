import { is } from "@babel/types";

export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  content: string;
  videoUrl: string;
  order: number;
  duration: number;
  isPublished: boolean;
  hasAssignment?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
