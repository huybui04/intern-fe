export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  slug?: string;
  description: string;
  content: string;
  videoUrl?: string;
  attachments?: {
    name: string;
    fileUrl: string;
    fileType: string;
  }[];
  order: number;
  duration: number; //in minutes
  isPublished: boolean;
  prerequisites?: string[];
  quizId?: string;
  viewsCount?: number;
  tags?: string[];
  hasAssignment?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
