import { UserResponse } from "./user";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: "student" | "instructor" | "admin";
}

export interface LoginResponse {
  message: string;
  data: {
    user: UserResponse;
    token: string;
  };
}

export interface RegisterResponse {
  message: string;
  data: UserResponse;
}
