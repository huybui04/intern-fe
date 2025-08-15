import type { UserResponse } from "../types/user";
import axiosInstance from "./axiosInstance";

export const getUsers = async (
  params?: any
): Promise<{ rowData: UserResponse[]; rowCount: number }> => {
  const res = await axiosInstance.get("/users", { params });
  return res.data;
};

export const getUserDetail = async (id: string): Promise<UserResponse> => {
  const res = await axiosInstance.get(`/users/${id}`);
  return res.data;
};

export const getUserProfile = async (
  id: string
): Promise<{ data: UserResponse }> => {
  const res = await axiosInstance.get(`/users/${id}`);
  return res.data;
};

export const updateUser = async (
  id: string,
  data: Partial<UserResponse>
): Promise<UserResponse> => {
  const res = await axiosInstance.put(`/users/${id}`, data);
  return res.data;
};

export const updateUserProfile = async (
  id: string,
  data: Partial<UserResponse>
): Promise<{ data: UserResponse }> => {
  const res = await axiosInstance.put(`/users/${id}`, data);
  return res.data;
};

export { UserResponse };
