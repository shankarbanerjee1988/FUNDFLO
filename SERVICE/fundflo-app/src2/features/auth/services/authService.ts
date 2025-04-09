import { axiosInstance } from '../../../lib/axios';
import { LoginCredentials,User } from '../../../types/auth';

interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
  
  register: async (userData: { email: string; password: string; name: string }): Promise<LoginResponse> => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  }
};