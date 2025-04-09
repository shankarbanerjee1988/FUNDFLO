import axios from 'axios';
import { getToken } from './token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.example.com',
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;