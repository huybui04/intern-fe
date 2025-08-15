import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "../types/auth";
import axiosInstance from "./axiosInstance";

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await axiosInstance.post("/auth/login", data);
  return res.data;
};

export const register = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
};
