import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'https://your-api-url.com/api',
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});