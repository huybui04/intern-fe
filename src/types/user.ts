export interface UserResponse {
  _id: string;
  username: string;
  email: string;
  role: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
