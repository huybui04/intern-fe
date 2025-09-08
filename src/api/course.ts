import { Course } from "../types/course";
import axiosInstance from "./axiosInstance";

export const getCourses = async (
  payload?: any
): Promise<{ data: { rows: Course[] }; rowCount: number }> => {
  const res = await axiosInstance.post("/courses", payload);
  return res.data;
};

export const getPublishedCourses = async (): Promise<{
  data: { rows: Course[] };
  rowCount: number;
}> => {
  return getCourses({ filter: { isPublished: true } });
};

export const getCourseDetail = async (
  id: string
): Promise<{ message: string; data: Course }> => {
  const res = await axiosInstance.get(`/courses/${id}`);
  return res.data;
};

export const createCourse = async (data: Partial<Course>): Promise<any> => {
  const res = await axiosInstance.post("/courses/create", data);
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
  const res = await axiosInstance.post("/courses/instructor/my-courses");
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

export const deleteCourse = async (id: string): Promise<any> => {
  const res = await axiosInstance.delete(`/courses/${id}`);
  return res.data;
};

// Get courses with pagination for AG Grid
export const getCoursesGrid = async (params: {
  startRow: number;
  endRow: number;
  sortModel?: any[];
  filterModel?: any;
}): Promise<{
  success: boolean;
  data: {
    rows: Course[];
    rowCount: number;
    lastRow: number;
    pageInfo: {
      startRow: number;
      endRow: number;
      pageSize: number;
      currentPage: number;
      totalPages: number;
    };
  };
}> => {
  const { startRow, endRow, sortModel, filterModel } = params;
  const pageSize = endRow - startRow;
  const page = Math.floor(startRow / pageSize) + 1;

  const payload = {
    page,
    pageSize,
    sortModel,
    filterModel,
  };

  try {
    console.log("Calling courses API with payload:", payload);
    const res = await axiosInstance.post("/courses/instructor/my-courses", payload);
    console.log("Raw courses API response:", res.data);

    // Handle the actual API response format
    if (res.data && res.data.success && res.data.data) {
      const responseData = res.data.data;
      let courses: Course[] = [];
      
      // Check if data.rows exists (paginated format)
      if (responseData.rows && Array.isArray(responseData.rows)) {
        courses = responseData.rows;
      } 
      // Check if data itself is an array
      else if (Array.isArray(responseData)) {
        courses = responseData;
      }
      // Check if data has courses property
      else if (responseData.courses && Array.isArray(responseData.courses)) {
        courses = responseData.courses;
      }
      else {
        console.error("No valid courses array found in:", responseData);
        courses = [];
      }
      
      const totalCount = res.data.rowCount || responseData.rowCount || courses.length;
      const isLastPage = courses.length < pageSize;
      
      console.log("Processed courses:", courses);
      console.log("Total count:", totalCount);
      
      return {
        success: true,
        data: {
          rows: courses,
          rowCount: totalCount,
          lastRow: isLastPage ? startRow + courses.length : -1,
          pageInfo: {
            startRow,
            endRow: startRow + courses.length,
            pageSize,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        },
      };
    } else {
      // Unexpected format
      console.error("Unexpected courses API response format:", res.data);
      return {
        success: false,
        data: {
          rows: [],
          rowCount: 0,
          lastRow: 0,
          pageInfo: {
            startRow,
            endRow: startRow,
            pageSize,
            currentPage: page,
            totalPages: 0,
          },
        },
      };
    }
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};
