import { Assignment, Submission, Answer } from "../types/assignment";
import axiosInstance from "./axiosInstance";

export const getAssignmentsByCourse = async (
  courseId: string
): Promise<{ data: { rows: Assignment[] }; rowCount?: number }> => {
  const res = await axiosInstance.get(`/assignments/course/${courseId}`);
  return res.data;
};

export const getAssignmentDetail = async (id: string): Promise<Assignment> => {
  const res = await axiosInstance.get(`/assignments/${id}`);
  return res.data;
};

export const createAssignment = async (
  data: Partial<Assignment>
): Promise<any> => {
  const res = await axiosInstance.post("/assignments", data);
  return res.data;
};

export const updateAssignment = async (
  id: string,
  data: Partial<Assignment>
): Promise<any> => {
  const res = await axiosInstance.put(`/assignments/${id}`, data);
  return res.data;
};

// Student submission APIs
export const submitAssignment = async (
  assignmentId: string,
  answers: Answer[]
): Promise<{
  success: boolean;
  message: string;
  autoGraded?: boolean;
  score?: number;
  feedback?: string;
}> => {
  const res = await axiosInstance.post(`/assignments/${assignmentId}/submit`, {
    answers,
  });
  return res.data;
};

export const getSubmissionDetail = async (
  assignmentId: string
): Promise<Submission> => {
  const res = await axiosInstance.get(
    `/assignments/${assignmentId}/submission`
  );
  return res.data;
};

export const getStudentSubmissions = async (): Promise<any> => {
  const res = await axiosInstance.get("/assignments/student/submissions");
  return res.data;
};

// Instructor grading APIs
export const getAssignmentSubmissions = async (
  assignmentId: string
): Promise<any> => {
  const res = await axiosInstance.get(
    `/assignments/${assignmentId}/submissions`
  );
  return res.data;
};

export const gradeSubmission = async (
  submissionId: string,
  data: { grade: number; feedback?: string }
): Promise<any> => {
  const res = await axiosInstance.put(
    `/assignments/submission/${submissionId}/grade`,
    data
  );
  return res.data;
};
