import { Lesson } from "../types/lesson";
import axiosInstance from "./axiosInstance";

export const getLessonsByCourse = async (params: {
  courseId: string;
  startRow?: number;
  endRow?: number;
}): Promise<{ rowData: Lesson[]; rowCount: number }> => {
  const { courseId, startRow = 0, endRow = 20 } = params;
  const pageSize = endRow - startRow;
  const page = Math.floor(startRow / pageSize) + 1;
  const res = await axiosInstance.get(
    `/lessons/course/${courseId}?page=${page}&pageSize=${pageSize}`
  );
  // Chuyển đổi dữ liệu trả về cho frontend
  return {
    rowData: res.data.rows,
    rowCount: res.data.lastRow || res.data.rows.length,
  };
};

export const getLessonDetail = async (id: string): Promise<Lesson> => {
  const res = await axiosInstance.get(`/lessons/${id}`);
  return res.data.data;
};

export const createLesson = async (data: Partial<Lesson>): Promise<any> => {
  const res = await axiosInstance.post("/lessons", data);
  return res.data;
};

export const updateLesson = async (
  id: string,
  data: Partial<Lesson>
): Promise<any> => {
  const res = await axiosInstance.put(`/lessons/${id}`, data);
  return res.data;
};
