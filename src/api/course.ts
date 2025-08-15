import { Course } from "../types/course";
import axiosInstance from "./axiosInstance";

export const getCourses = async (
  payload?: any
): Promise<{ data: { rows: Course[] }; rowCount: number }> => {
  const res = await axiosInstance.post("/courses", payload);
  return res.data;
};

export const getCourseDetail = async (
  id: string
): Promise<{ message: string; data: Course }> => {
  const res = await axiosInstance.get(`/courses/${id}`);
  return res.data;
};

export const createCourse = async (data: Partial<Course>): Promise<any> => {
  const res = await axiosInstance.post("/courses", data);
  return res.data;
};

export const updateCourse = async (
  id: string,
  data: Partial<Course>
): Promise<any> => {
  const res = await axiosInstance.put(`/courses/${id}`, data);
  return res.data;
};

// Student-specific API calls
export const getMyCourses = async (): Promise<{
  data: { rows: Course[] };
  rowCount: number;
}> => {
  const res = await axiosInstance.get("/courses/student/my-courses");
  return res.data;
};

export const enrollInCourse = async (courseId: string): Promise<any> => {
  const res = await axiosInstance.post(`/courses/${courseId}/enroll`);
  return res.data;
};

// Instructor-specific API calls
export const getInstructorCourses = async (): Promise<{
  data: { rows: Course[] };
  rowCount: number;
}> => {
  const res = await axiosInstance.get("/courses/instructor/my-courses");
  return res.data;
};

export const getCourseStats = async (courseId: string): Promise<any> => {
  const res = await axiosInstance.get(`/courses/${courseId}/stats`);
  return res.data;
};

export const getCourseById = async (
  id: string
): Promise<{ message: string; data: Course }> => {
  const res = await axiosInstance.get(`/courses/${id}`);
  return res.data;
};

export const getRelatedCourses = async (
  courseId: string
): Promise<{
  data: { rows: Course[] };
  rowCount: number;
}> => {
  const res = await axiosInstance.get(`/courses/${courseId}/related`);
  return res.data;
};
